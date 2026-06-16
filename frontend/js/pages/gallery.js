/* ==========================================================================
   STRIKZ ESPORTS - GALLERY PAGE RENDERER
   ========================================================================== */

(function() {
    function renderGallery(container) {
        const db = window.strikzDb.get();
        const gallery = db.gallery || [];

        // Build list of unique albums in database
        const uniqueAlbums = ['All Albums'];
        gallery.forEach(img => {
            const albumName = img.album || 'General';
            if (!uniqueAlbums.includes(albumName)) {
                uniqueAlbums.push(albumName);
            }
        });

        container.innerHTML = `
            <section class="container reveal" style="padding-top: 40px; margin-bottom: 80px;">
                <div class="section-header">
                    <span class="section-subtitle">VISUAL LOGS</span>
                    <h2 class="section-title">MEDIA <span>HIGHLIGHT SHOWCASE</span></h2>
                    <div class="section-divider"></div>
                </div>

                <!-- Media Tabs & Album Filter -->
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; margin-bottom: 30px;">
                    <div class="filter-tabs" style="margin-bottom: 0;">
                        <button class="filter-tab active" id="gallery-tab-all">ALL MEDIA</button>
                        <button class="filter-tab" id="gallery-tab-photos">PHOTOS</button>
                    </div>
                    
                    <div id="gallery-album-filter-container" style="display: flex; align-items: center; gap: 8px;">
                        <label style="font-family: var(--font-header); font-size: 11px; color: var(--text-dim); letter-spacing: 0.1em; font-weight: 700;">ALBUM:</label>
                        <select id="gallery-album-select" style="background: #101010; border: 1px solid var(--glass-border); padding: 8px 16px; border-radius: 4px; color: #fff; font-family: var(--font-header); font-size: 11px; cursor: pointer; min-width: 150px; outline: none; transition: border-color 0.3s;" onfocus="this.style.borderColor='var(--neon-yellow)'" onblur="this.style.borderColor='var(--glass-border)'">
                            ${uniqueAlbums.map(a => `<option value="${a}">${a.toUpperCase()}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <!-- Gallery Grid -->
                <div class="gallery-grid reveal-stagger" id="media-grid">
                    <!-- Loaded dynamically -->
                </div>
            </section>

            <!-- Lightbox Modal container -->
            <div class="lightbox" id="gallery-lightbox">
                <span class="lightbox-close" id="lightbox-close-btn">&times;</span>
                <img class="lightbox-content" id="lightbox-img" src="" alt="Zoomed View">
            </div>
        `;

        const mediaGrid = document.getElementById('media-grid');
        const lightbox = document.getElementById('gallery-lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxClose = document.getElementById('lightbox-close-btn');
        const albumSelect = document.getElementById('gallery-album-select');

        let currentTypeFilter = 'all';

        function loadMedia() {
            let mediaHtml = '';
            const selectedAlbum = albumSelect ? albumSelect.value : 'All Albums';

            // Load Photos
            if (currentTypeFilter === 'all' || currentTypeFilter === 'photos') {
                gallery.forEach(img => {
                    const itemAlbum = img.album || 'General';
                    if (selectedAlbum === 'All Albums' || itemAlbum === selectedAlbum) {
                        mediaHtml += `
                            <div class="gallery-item photo-item" data-url="${img.url}">
                                <img src="${img.url}" alt="${img.title}">
                                <div class="gallery-overlay">
                                    <i class="fa-solid fa-expand"></i>
                                    <span style="position: absolute; bottom: 8px; left: 8px; font-size: 8px; font-weight: 800; background: rgba(0,0,0,0.6); padding: 3px 6px; border-radius: 2px; font-family: var(--font-header); letter-spacing: 0.1em; color: var(--neon-yellow);">${itemAlbum.toUpperCase()}</span>
                                </div>
                            </div>
                        `;
                    }
                });
            }

            mediaGrid.innerHTML = mediaHtml || `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 0; color: var(--text-dim);">
                    <i class="fa-solid fa-folder-open" style="font-size: 40px; margin-bottom: 15px; color: var(--neon-yellow); opacity: 0.5;"></i>
                    <p style="font-size: 13px;">No media files found in album: <strong>${selectedAlbum.toUpperCase()}</strong></p>
                </div>
            `;

            // Bind Lightbox click to photos
            mediaGrid.querySelectorAll('.photo-item').forEach(item => {
                item.onclick = function() {
                    const url = this.dataset.url;
                    lightboxImg.src = url;
                    lightbox.classList.add('active');
                };
            });

            // Re-trigger scroll animations for filtered media
            setTimeout(() => {
                mediaGrid.classList.add('active');
                mediaGrid.querySelectorAll('.gallery-item').forEach(item => {
                    item.style.opacity = 1;
                    item.style.transform = 'translateY(0)';
                });
            }, 50);
        }

        // Close Lightbox
        lightboxClose.onclick = closeLightbox;
        lightbox.onclick = function(e) {
            if (e.target === lightbox) closeLightbox();
        };

        function closeLightbox() {
            lightbox.classList.remove('active');
            lightboxImg.style.display = 'block';
        }

        // Initial Load
        loadMedia();

        // Filter tabs binding
        const tabAll = document.getElementById('gallery-tab-all');
        const tabPhotos = document.getElementById('gallery-tab-photos');

        function clearActive() {
            [tabAll, tabPhotos].forEach(t => t.classList.remove('active'));
        }

        tabAll.onclick = function() { clearActive(); this.classList.add('active'); currentTypeFilter = 'all'; loadMedia(); };
        tabPhotos.onclick = function() { clearActive(); this.classList.add('active'); currentTypeFilter = 'photos'; loadMedia(); };

        if (albumSelect) {
            albumSelect.onchange = loadMedia;
        }
    }

    // Attach to global window
    window.renderGallery = renderGallery;
})();
