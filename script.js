<script>
        let isModalOpen = false;
        let allProperties = []; // simpan semua properti dari API
        let touchStartX = 0;
        let touchEndX = 0;

        // 🔍 Event listener untuk search alamat
        document.getElementById("searchAddress").addEventListener("input", (e) => {
            const keyword = e.target.value.toLowerCase();
            const filtered = allProperties.filter(p =>
                p.alamat && p.alamat.toLowerCase().includes(keyword)
            );
            displayProperties(filtered);
        });
        
        // ⬇️ Event listener untuk urutkan harga - UPDATE
        document.getElementById("sortPrice").addEventListener("change", (e) => {
            const value = e.target.value;
            let sorted = [...allProperties]; // clone array
        
            if (value === "terlama") {
                // Urutkan dari terlama (berdasarkan timestamp atau createdAt jika ada)
                sorted.sort((a, b) => {
                    // Coba gunakan timestamp jika ada
                    if (a.timestamp && b.timestamp) {
                        return new Date(a.timestamp) - new Date(b.timestamp);
                    }
                    // Coba gunakan createdAt jika ada
                    else if (a.createdAt && b.createdAt) {
                        return new Date(a.createdAt) - new Date(b.createdAt);
                    }
                    // Coba gunakan updatedAt jika ada
                    else if (a.updatedAt && b.updatedAt) {
                        return new Date(a.updatedAt) - new Date(b.updatedAt);
                    }
                    // Jika tidak ada field waktu, gunakan ID sebagai fallback
                    else {
                        const idA = typeof a.id === 'string' ? parseInt(a.id) || 0 : a.id;
                        const idB = typeof b.id === 'string' ? parseInt(b.id) || 0 : b.id;
                        return idA - idB;
                    }
                });
            } else if (value === "asc") {
                // 🔹 GUNAKAN harga_numerik UNTUK SORTING TERMURAH -> TERMAHAL
                sorted.sort((a, b) => (a.harga_numerik || 0) - (b.harga_numerik || 0));
            } else if (value === "desc") {
                // 🔹 GUNAKAN harga_numerik UNTUK SORTING TERMAHAL -> TERMURAH
                sorted.sort((a, b) => (b.harga_numerik || 0) - (a.harga_numerik || 0));
            } else {
                // Default: terbaru (kebalikan dari terlama)
                sorted.sort((a, b) => {
                    // Coba gunakan timestamp jika ada
                    if (a.timestamp && b.timestamp) {
                        return new Date(b.timestamp) - new Date(a.timestamp);
                    }
                    // Coba gunakan createdAt jika ada
                    else if (a.createdAt && b.createdAt) {
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                    // Coba gunakan updatedAt jika ada
                    else if (a.updatedAt && b.updatedAt) {
                        return new Date(b.updatedAt) - new Date(a.updatedAt);
                    }
                    // Jika tidak ada field waktu, gunakan ID sebagai fallback
                    else {
                        const idA = typeof a.id === 'string' ? parseInt(a.id) || 0 : a.id;
                        const idB = typeof b.id === 'string' ? parseInt(b.id) || 0 : b.id;
                        return idB - idA;
                    }
                });
            }
        
            displayProperties(sorted);
        });


        // URL API backend Anda
        const BACKEND_API_URL = 'https://foto-backend-omn1.vercel.app/api/photos';
        
        // Nomor WhatsApp untuk kontak
        const WHATSAPP_NUMBER = "6285546451649"; // Ganti dengan nomor WhatsApp Anda
        const WHATSAPP_MESSAGE = "Apakah rumah nomer {nomer} masih ada? Saya tertarik dengan properti ini.";

        // Function to format price with proper dots
        function formatPrice(price) {
          if (price === null || price === undefined) return "Harga tidak tersedia";
          
          const str = String(price).trim();
        
          // Kalau string sudah mengandung Rp atau Nego → biarkan tampil apa adanya
          if (/rp/i.test(str) || /nego/i.test(str)) {
            // Bersihkan duplikat spasi dan samakan kapitalisasi
            return str
              .replace(/\s+/g, " ")
              .replace(/\(?\s*nego\s*\)?/gi, "(Nego)")
              .replace(/rp/gi, "Rp")
              .trim();
          }
        
          // Fallback: tampilkan apa adanya
          return str;
        }


        // Function to format description - only format if specific patterns exist
        function formatDescription(description) {
            if (!description) return 'Tidak ada deskripsi';

            const normalizedDesc = description
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n')
                .replace(/•\s*\n\s*(\d+ Menit ke)/g, '• $1')  // Untuk pattern "•" diikuti angka
                .replace(/•\s*\n\s*([A-Za-z])/g, '• $1')
                .replace(/\s*———————————\s*/g, '\n———————————\n')
                .replace(/(\n)SPESIFIKASI\s*:/g, '$1———————————\nSPESIFIKASI:\n———————————')
                .replace(/(\n)FASILITAS\s*:/g, '$1———————————\nFASILITAS:\n———————————')
                .replace(/(\n)SELLING POINT\s*:/g, '$1———————————\nSELLING POINT:\n———————————')
                .replace(/\n\s*\n/g, '\n\n')
                .trim(); 
            
            let formatted = `📝 <strong>Deskripsi:</strong><br>`;
            
            // Only apply special formatting if the old structured patterns exist
            if (normalizedDesc.includes('SPESIFIKASI') || normalizedDesc.includes('———————————')) {
                formatted += normalizedDesc
                    .replace(/SPESIFIKASI —+/g, '<br><strong>SPESIFIKASI</strong><hr class="desc-separator">')
                    .replace(/FASILITAS PERUMAHAN —+/g, '<br><strong>FASILITAS PERUMAHAN</strong><hr class="desc-separator">')
                    .replace(/SELLING POINT : —+/g, '<br><strong>SELLING POINT</strong><hr class="desc-separator">')
                    .replace(/\n*•\s*/g, '<br>•')
                    .replace(/•\s*\n\s*(\d+ Menit ke)/g, '• $1') 
            } else {
                // For natural descriptions, just use as is
                formatted += normalizedDesc;
            }
            
            return formatted;
        }

        // Function to create WhatsApp link
        function createWhatsAppLink(propertyId, propertyType) {
            const message = WHATSAPP_MESSAGE
                .replace('{nomer}', propertyId)
                .replace('{type}', propertyType);
            const encodedMessage = encodeURIComponent(message);
            return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
        }
    
        // Function to create property card
        function createPropertyCard(property) {
            const info = extractInfoFromDescription(property.deskripsi || '');
            const card = document.createElement('div');
            card.className = 'property-card';
            card.setAttribute('data-id', property.id);
            
            if (property.status && property.status.toUpperCase() === "SOLD") {
                card.classList.add("sold");
            }
            
            // Use first photo as main image
            let mainImage = property.foto && property.foto.length > 0 ? property.foto[0] : null;
        
            // Cek dan ekstrak URL dari rumus =IMAGE()
            if (mainImage && mainImage.startsWith('=IMAGE("') && mainImage.endsWith('")')) {
                mainImage = mainImage.substring(8, mainImage.length - 2);
            }
        
            // Tentukan tampilan harga berdasarkan ada/tidaknya promo
            let priceHTML = '';
            if (property.harga_asli && property.harga_promo) {
              const hasNego = /\bnego\b/i.test(property.harga_promo || '');
              priceHTML = `
                <div class="property-price-promo">
                  <div class="original-price">${property.harga_asli}</div>
                  <div class="promo-price">
                    ${property.harga_promo}${hasNego ? '' : ''}
                  </div>
                </div>
              `;
            } else {
              priceHTML = `
                <div class="property-price normal-price">
                  ${property.harga_display || ('Rp ' + new Intl.NumberFormat('id-ID').format(property.harga))}
                </div>
              `;
            }

            
            card.innerHTML = `
                <div class="property-image">
                    ${mainImage ? 
                        `<img src="${mainImage}" alt="Property ${property.id}" loading="lazy">` : 
                        `<div class="no-image"><i class="far fa-image"></i> Tidak ada gambar</div>`
                    }
                    <div class="property-badge">${property.type || 'Properti'}</div>
                    <div class="property-number">#${property.id}</div>
                    ${property.status && property.status.toUpperCase() === "SOLD" ? 
                        `<div class="sold-overlay">SOLD</div>` : ""}
                </div>
                <div class="property-details">
                    ${priceHTML} <!-- GUNAKAN priceHTML di sini, bukan kode lama -->
                    <div class="property-address"><i class="fas fa-map-marker-alt"></i> ${property.alamat || 'Alamat tidak tersedia'}</div>
                    <div class="property-features">
                        <div class="feature"><i class="fas fa-bed"></i> ${property.kamar || '0'} KT</div>
                        <div class="feature"><i class="fas fa-bath"></i> ${property.kamar_mandi || '0'} KM</div>

                        ${info.LT ? `
                            <div class="feature luas"><i class="fas fa-ruler-combined"></i> LT: ${info.LT} m²</div>
                        ` : ''}
                        
                        ${info.LB ? `
                            <div class="feature luas"><i class="fas fa-home"></i> LB: ${info.LB} m²</div>
                        ` : ''}

                        ${info.Sertifikat ? `
                          <div class="feature sertifikat">
                            <i class="fas fa-file-contract"></i> ${info.Sertifikat}
                          </div>
                        ` : ''}

                    </div>
                    <div class="property-action">
                        <button class="view-details-btn"><i class="fas fa-eye"></i> Lihat Detail</button>
                        <button class="whatsapp-btn"><i class="fab fa-whatsapp"></i> Tanya</button>
                    </div>
                </div>
            `;
            
            // Kalau status SOLD, skip event klik
            if (!(property.status && property.status.toUpperCase() === "SOLD")) {
                const viewDetailsBtn = card.querySelector('.view-details-btn');
                viewDetailsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showPropertyModal(property);
                });
            
                const whatsappBtn = card.querySelector('.whatsapp-btn');
                whatsappBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.open(createWhatsAppLink(property.id, property.type), '_blank');
                });
            
                card.addEventListener('click', () => {
                    showPropertyModal(property);
                });
            }
            
            return card;
        }
        
        
        // Function to create photo gallery for the modal
        function createPhotoGallery(photos) {
            if (!photos || photos.length === 0) {
                return `<div class="modal-no-image"><i class="far fa-image"></i> Tidak ada gambar</div>`;
            }
        
            const galleryHTML = photos.map(photoUrl => {
                // Cek dan ekstrak URL dari rumus =IMAGE()
                if (photoUrl && photoUrl.startsWith('=IMAGE("') && photoUrl.endsWith('")')) {
                    photoUrl = photoUrl.substring(8, photoUrl.length - 2);
                }
                return `<img src="${photoUrl}" alt="Properti" loading="lazy">`;
            }).join('');
        
            return `<div class="modal-gallery-container">${galleryHTML}</div>`;
        }


        // Function to display properties
        function displayProperties(properties) {
            const propertyGrid = document.getElementById('propertyGrid');
            propertyGrid.innerHTML = '';
            
            if (properties.length === 0) {
                propertyGrid.innerHTML = '<div class="loading">Tidak ada properti yang ditemukan</div>';
                return;
            }
            
            properties.forEach(property => {
                const card = createPropertyCard(property);
                propertyGrid.appendChild(card);
            });
        }

        function extractInfoFromDescription(description) {
            const result = { LT: null, LB: null };
            if (!description) return result;
        
            // Cari pola seperti "LT: 259" atau "LT 259 m²"
            const ltMatch = description.match(/LT\s*[:\-]?\s*(\d+(?:[\.,]\d+)?)\s*m/i);
            const lbMatch = description.match(/LB\s*[:\-]?\s*(\d+(?:[\.,]\d+)?)\s*m/i);

            const sertifikatMatch = description.match(/\b(SHM|shm|hm|HM|HGB|AJB|PPJB)\b/i);
        
            if (ltMatch) result.LT = ltMatch[1];
            if (lbMatch) result.LB = lbMatch[1];
            if (sertifikatMatch) result.Sertifikat = sertifikatMatch[1].toUpperCase();
            
            return result;
        }

        // Function to show property modal
        function showPropertyModal(property) {
            const info = extractInfoFromDescription(property.deskripsi || '');
            const modal = document.getElementById('propertyModal');
            const modalContent = document.getElementById('modalContent');

            // Add to browser history - HANYA jika modal belum terbuka
            if (!isModalOpen) {
                window.history.pushState({ modal: true }, '');
            }
            
            // Set flag
            isModalOpen = true;

            // Tentukan tampilan harga untuk modal
            let modalPriceHTML = '';
            console.log("DEBUG harga_promo:", property.harga_promo);
            if (property.harga_asli && property.harga_promo) {
              const hasNego = /\bnego\b/i.test(property.harga_promo || '');
              modalPriceHTML = `
                <div class="modal-price-promo">
                  <div class="modal-original-price">${property.harga_asli}</div>
                  <div class="modal-promo-price">
                    ${property.harga_promo}${hasNego ? '' : ''}
                  </div>
                </div>
              `;
            } else {
              modalPriceHTML = `
                <div class="modal-price normal-price">
                  ${property.harga_display || ('Rp ' + new Intl.NumberFormat('id-ID').format(property.harga))}
                </div>
              `;
            }

            
            // Create modal content
            modalContent.innerHTML = `
                <div class="modal-slider">
                    <div class="modal-slider-container" 
                         id="modalSlider-${property.id}" 
                         data-current="0">
                        ${property.foto && property.foto.length > 0 ? 
                            property.foto.map(img => 
                                `<div class="slide"><img src="${img}" alt="Property ${property.id}"></div>`
                            ).join('') :
                            `<div class="slide no-image" style="display: flex; align-items: center; justify-content: center;">
                                <i class="far fa-image"></i> Tidak ada gambar
                            </div>`
                        }
                    </div>
                    
                    ${property.foto && property.foto.length > 1 ? `
                    <div class="modal-slider-arrow prev" onclick="moveModalSlide('${property.id}', -1)">
                        <i class="fas fa-chevron-left"></i>
                    </div>
                    <div class="modal-slider-arrow next" onclick="moveModalSlide('${property.id}', 1)">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                    <div class="modal-slider-nav">
                        ${property.foto.map((_, index) => 
                            `<div class="modal-slider-dot ${index === 0 ? 'active' : ''}" 
                                  onclick="showModalSlide('${property.id}', ${index})"></div>`
                        ).join('')}
                    </div>
                ` : ''}
                <div class="modal-property-number">#${property.id}</div>
            </div>
                
                <div class="modal-details">
                    ${modalPriceHTML}
                    <div class="modal-type">${property.type || 'Properti'}</div>
                    <div class="modal-address">
                        <i class="fas fa-map-marker-alt"></i> ${property.alamat || 'Alamat tidak tersedia'}
                    </div>
                    <div class="modal-description">${formatDescription(property.deskripsi) || 'Tidak ada deskripsi'}</div>
                    <div class="modal-features">
                        <div class="modal-feature"><i class="fas fa-bed"></i> ${property.kamar || '0'} KT</div>
                        <div class="modal-feature"><i class="fas fa-bath"></i> ${property.kamar_mandi || '0'} KM</div>

                        ${info.LT ? `
                            <div class="modal-feature"><i class="fas fa-ruler-combined"></i> LT: ${info.LT} m²</div>
                        ` : ''}
                        
                        ${info.LB ? `
                            <div class="modal-feature"><i class="fas fa-home"></i> LB: ${info.LB} m²</div>
                        ` : ''}

                        ${info.Sertifikat ? `
                          <div class="feature sertifikat">
                            <i class="fas fa-file-contract"></i> ${info.Sertifikat}
                          </div>
                        ` : ''}

                    </div>
                
                    ${property.link && property.link.trim() !== "" ? `
                        <a href="${property.link}" target="_blank" class="modal-link">
                            <i class="fas fa-map-marked-alt"></i> Lihat di Google Maps
                        </a>
                    ` : `
                        <a href="map-fallback.html?nomor=${property.id}" class="modal-link" style="background: #4a6491; color: white;">
                            <i class="fas fa-map-marker-alt"></i> Lihat di Google Maps
                        </a>
                    `}
                </div>
            `;

            
            // Show modal
            modal.style.display = 'block';
            
            // Store current property ID for slider functions
            modal.setAttribute('data-current-property', property.id);
            
            // Prevent body scrolling when modal is open
            document.body.style.overflow = 'hidden';

            // Add swipe functionality for mobile
            handleSwipeGesture(property.id);
        }

        // Function to move modal slides
        function moveModalSlide(propertyId, direction) {
            const slider = document.getElementById(`modalSlider-${propertyId}`);
            if (!slider) return;
            
            const slides = slider.querySelectorAll('.slide');
            const dotsContainer = document.querySelector(`#modalSlider-${propertyId} ~ .modal-slider-nav`);
            const dots = dotsContainer ? dotsContainer.querySelectorAll('.modal-slider-dot') : [];
            
            const currentSlide = parseInt(slider.getAttribute('data-current') || 0);
            let newSlide = currentSlide + direction;
            
            if (newSlide < 0) newSlide = slides.length - 1;
            if (newSlide >= slides.length) newSlide = 0;
            
            slider.style.transform = `translateX(-${newSlide * 100}%)`;
            slider.setAttribute('data-current', newSlide);
            
            // Update dots
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === newSlide);
            });
        }

        // Function to show specific modal slide
        function showModalSlide(propertyId, slideIndex) {
            const slider = document.getElementById(`modalSlider-${propertyId}`);
            if (!slider) return;
        
            const dotsContainer = document.querySelector(`#modalSlider-${propertyId} ~ .modal-slider-nav`);
            const dots = dotsContainer ? dotsContainer.querySelectorAll('.modal-slider-dot') : [];
        
            slider.style.transform = `translateX(-${slideIndex * 100}%)`;
            slider.setAttribute('data-current', slideIndex);
            
            // Update dots
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === slideIndex);
            });
        }

        // Function to handle touch events for swipe
        function handleSwipeGesture(propertyId) {
            const slider = document.getElementById(`modalSlider-${propertyId}`);
            if (!slider) return;
        
            // Remove existing event listeners to avoid duplicates
            slider.ontouchstart = null;
            slider.ontouchend = null;
        
            // Touch start event
            slider.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });
        
            // Touch end event
            slider.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe(propertyId);
            }, { passive: true });
        }
        
        // Function to determine swipe direction
        function handleSwipe(propertyId) {
            const minSwipeDistance = 50; // Minimum distance to consider as a swipe
            
            if (touchStartX - touchEndX > minSwipeDistance) {
                // Swipe left - next slide
                moveModalSlide(propertyId, 1);
            } else if (touchEndX - touchStartX > minSwipeDistance) {
                // Swipe right - previous slide
                moveModalSlide(propertyId, -1);
            }
        }
        
        // Close modal function
        function setupModalClose() {
            const modal = document.getElementById('propertyModal');
            const closeBtn = document.getElementById('closeModal');
            
            closeBtn.addEventListener('click', closeModal);
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });
        }

        // New function to handle modal closing
        function closeModal() {
            const modal = document.getElementById('propertyModal');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            isModalOpen = false;

            // Kembalikan history state tanpa men-trigger popstate lagi
            if (window.history.state && window.history.state.modal) {
                window.history.back();
            }
        }

        // Fetch properties from API
        async function fetchAndDisplayProperties() {
            const propertyGrid = document.getElementById('propertyGrid');
            const errorElement = document.getElementById('errorMessage');
            
            // Show loading state
            propertyGrid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Memuat properti...</div>';
            errorElement.innerHTML = ''; // reset error message
            
            try {
                const response = await fetch(`${BACKEND_API_URL}?_=${Date.now()}`, {
                    cache: "no-store"
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                
                if (data && data.length > 0) {
                    allProperties = data; // simpan ke variabel global
                    
                    // 🔹 PERBAIKAN: URUTKAN DEFAULT "TERBARU" DENGAN KONSISTEN
                    allProperties.sort((a, b) => {
                        // Prioritaskan ID numerik (asumsi ID lebih besar = lebih baru)
                        const idA = parseInt(a.id) || 0;
                        const idB = parseInt(b.id) || 0;
                        return idB - idA; // ID besar dulu = terbaru
                    });

                    console.log('🔄 Displaying properties...');
                    displayProperties(allProperties);
                    // 🔹 RESET SELECT BOX KE "TERBARU"
                    document.getElementById("sortPrice").value = "default";
                    console.log('✅ Data loaded successfully');
                    
                } else {
                    console.log('ℹ️ No properties found');
                    propertyGrid.innerHTML = '<div class="loading">Tidak ada properti yang ditemukan</div>';
                }
            } catch (error) {
                console.error('❌ Error fetching properties:', error);
                console.error('Error fetching properties:', error);
                errorElement.innerHTML = '⚠️ Gagal memuat properti. Silakan coba lagi.';
                propertyGrid.innerHTML = '';
            }
        
        }

        // Hanya satu event listener untuk popstate
        window.addEventListener('popstate', (e) => {
            // Jika modal sedang terbuka, tutup modal
            if (isModalOpen) {
                closeModal();
                
                // Jika ini state modal kita, tambahkan state kembali
                if (e.state && e.state.modal) {
                    // Delay sedikit untuk menghindari loop
                    setTimeout(() => {
                        window.history.pushState({}, '');
                    }, 10);
                }
            }
        });


        // Initialize the page
        document.addEventListener('DOMContentLoaded', () => {
            // Setup modal close functionality
            setupModalClose();
            
            // Add event listeners to control buttons
            document.getElementById('loadData').addEventListener('click', fetchAndDisplayProperties);
            // 🔹 RESET FILTER SAAT REFRESH
            document.getElementById("searchAddress").value = "";
            document.getElementById("sortPrice").value = "default";
            
            // Load data initially
            fetchAndDisplayProperties();
        });
    </script>
