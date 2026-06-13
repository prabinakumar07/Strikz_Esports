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
                        <button class="filter-tab" id="gallery-tab-videos">VIDEOS</button>
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

        // Initial videos list
        const videos = [
            { id: 101, title: 'FFWS Grand Finals Winning Moments', preview: 'assets/tournament_banner.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', album: 'Championships' },
            { id: 102, title: 'STRIKZ.Storm Rusher Highlights: 20 Kills', preview: 'assets/hero_bg.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', album: 'Highlights' }
        ];

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

            // Load Videos
            if (currentTypeFilter === 'all' || currentTypeFilter === 'videos') {
                videos.forEach(vid => {
                    const itemAlbum = vid.album || 'General';
                    if (selectedAlbum === 'All Albums' || itemAlbum === selectedAlbum) {
                        mediaHtml += `
                            <div class="gallery-item video-item" style="height: 180px;" data-video="${vid.videoUrl}">
                                <img src="${vid.preview}" alt="${vid.title}" style="filter: brightness(0.6);">
                                <div class="gallery-overlay" style="opacity: 1; background: rgba(0,0,0,0.3);">
                                    <i class="fa-solid fa-circle-play" style="font-size: 40px; color: var(--neon-orange); filter: drop-shadow(0 0 10px var(--neon-orange-glow));"></i>
                                    <span style="position: absolute; bottom: 8px; left: 8px; font-size: 8px; font-weight: 800; background: rgba(0,0,0,0.6); padding: 3px 6px; border-radius: 2px; font-family: var(--font-header); letter-spacing: 0.1em; color: var(--neon-yellow);">${itemAlbum.toUpperCase()}</span>
                                </div>
                                <div style="position: absolute; bottom: 10px; left: 10px; right: 10px; font-size: 11px; text-shadow: 1px 1px 2px #000; font-weight: 600;">
                                    ${vid.title}
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

            // Bind Video modal to videos
            mediaGrid.querySelectorAll('.video-item').forEach(item => {
                item.onclick = function() {
                    const videoUrl = this.dataset.video;
                    lightboxImg.style.display = 'none';
                    
                    let iframe = document.getElementById('lightbox-video-frame');
                    if (!iframe) {
                        iframe = document.createElement('iframe');
                        iframe.id = 'lightbox-video-frame';
                        iframe.style.width = '80vw';
                        iframe.style.height = '45vw';
                        iframe.style.maxWidth = '800px';
                        iframe.style.maxHeight = '450px';
                        iframe.style.border = '2px solid var(--neon-cyan-border)';
                        iframe.style.boxShadow = '0 0 25px var(--neon-cyan-glow)';
                        lightbox.appendChild(iframe);
                    }
                    iframe.src = videoUrl;
                    iframe.style.display = 'block';
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
            const iframe = document.getElementById('lightbox-video-frame');
            if (iframe) {
                iframe.src = '';
                iframe.style.display = 'none';
            }
            lightboxImg.style.display = 'block';
        }

        // Initial Load
        loadMedia();

        // Filter tabs binding
        const tabAll = document.getElementById('gallery-tab-all');
        const tabPhotos = document.getElementById('gallery-tab-photos');
        const tabVideos = document.getElementById('gallery-tab-videos');

        function clearActive() {
            [tabAll, tabPhotos, tabVideos].forEach(t => t.classList.remove('active'));
        }

        tabAll.onclick = function() { clearActive(); this.classList.add('active'); currentTypeFilter = 'all'; loadMedia(); };
        tabPhotos.onclick = function() { clearActive(); this.classList.add('active'); currentTypeFilter = 'photos'; loadMedia(); };
        tabVideos.onclick = function() { clearActive(); this.classList.add('active'); currentTypeFilter = 'videos'; loadMedia(); };

        if (albumSelect) {
            albumSelect.onchange = loadMedia;
        }
    }

    // Attach to global window
    window.renderGallery = renderGallery;
})();
