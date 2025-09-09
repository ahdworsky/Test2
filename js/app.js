
(function(){
  function onReady(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  onReady(function(){

    // ---------- Helpers ----------
    function $(sel, root){ return (root||document).querySelector(sel); }
    function $all(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
    function lockScroll(on){ try{ document.body.style.overflow = on ? 'hidden' : ''; }catch(e){} }

    // ---------- Appointment Form ----------
    var formEl = $('#appointment-form');
    var backdropEl = $('#modal-backdrop');
    function openForm(){ if(formEl && backdropEl){ formEl.hidden=false; backdropEl.hidden=false; lockScroll(true); } }
    function closeForm(){ if(formEl && backdropEl){ formEl.hidden=true; backdropEl.hidden=true; lockScroll(false); } }

    // Open
    document.addEventListener('click', function(e){
      var openBtn = e.target.closest && e.target.closest('a.js-open-appt');
      if(openBtn){ e.preventDefault(); openForm(); }
    });
    // Close via backdrop / X
    document.addEventListener('click', function(e){
      if(e.target && e.target.id==='modal-backdrop'){ closeForm(); }
      if(e.target && e.target.closest && e.target.closest('.close-btn')){ e.preventDefault(); closeForm(); }
    });
    // Close on Esc
    document.addEventListener('keydown', function(e){
      if(e.key==='Escape'){ closeForm(); closeVideoModal(); closeImageLightbox(); }
    });

    // ---------- Image Lightbox (single + gallery) ----------
    var imgBox = $('#img-lightbox');
    var imgView = $('#img-view');
    var fig = $('#img-modal');
    var prevBtn = $('#img-prev');
    var nextBtn = $('#img-next');
    var countEl = $('#img-count');
    var thumbs = $('#img-thumbs');

    var galleryList = null;
    var galleryIndex = 0;

    // Inject minimal gallery UI styles once
    (function injectStyles(){
      if (document.getElementById('gallery-ui-styles')) return;
      var s = document.createElement('style'); s.id='gallery-ui-styles';
      s.textContent = [
        '#img-count{position:absolute;right:8px;top:8px;background:rgba(0,0,0,.55);color:#fff;padding:2px 6px;border-radius:4px;font:600 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Arial;}',
        '#img-thumbs{display:flex;gap:8px;align-items:center;padding:8px;overflow-x:auto;background:rgba(0,0,0,.4);}',
        '#img-thumbs .thumb{border:0;background:none;padding:0;cursor:pointer;}',
        '#img-thumbs img{width:72px;height:48px;object-fit:cover;opacity:.75;border:2px solid transparent;border-radius:4px;display:block;}',
        '#img-thumbs img.active{opacity:1;border-color:#fff;}',
        '#img-prev,#img-next{position:absolute;top:50%;transform:translateY(-50%);font-size:28px;background:rgba(0,0,0,.55);color:#fff;border:0;border-radius:4px;width:36px;height:36px;cursor:pointer;}',
        '#img-prev{left:8px;} #img-next{right:8px;}'
      ].join('');
      document.head.appendChild(s);
    })();

    function ensureUI(){
      if(!fig) { fig = $('#img-modal'); if(!fig) return; }
      if(!countEl){
        countEl = document.createElement('div'); countEl.id='img-count'; countEl.style.display='none'; fig.appendChild(countEl);
      }
      if(!prevBtn){
        prevBtn = document.createElement('button'); prevBtn.id='img-prev'; prevBtn.setAttribute('aria-label','Previous image');
        prevBtn.textContent='‹'; prevBtn.style.display='none'; fig.appendChild(prevBtn);
        prevBtn.addEventListener('click', function(ev){ ev.preventDefault(); step(-1); });
      }
      if(!nextBtn){
        nextBtn = document.createElement('button'); nextBtn.id='img-next'; nextBtn.setAttribute('aria-label','Next image');
        nextBtn.textContent='›'; nextBtn.style.display='none'; fig.appendChild(nextBtn);
        nextBtn.addEventListener('click', function(ev){ ev.preventDefault(); step(1); });
      }
      if(!thumbs){
        thumbs = document.createElement('div'); thumbs.id='img-thumbs'; thumbs.style.display='none';
        fig.appendChild(thumbs);
      }
    }

    function updateCounter(){
      if(!countEl) return;
      if(galleryList && galleryList.length>1){
        countEl.textContent = (galleryIndex+1) + ' / ' + galleryList.length;
        countEl.style.display = '';
      } else {
        countEl.style.display = 'none';
      }
    }

    function render(src){
      if(imgView){ imgView.src = src; }
      // Preload neighbors for smoother next/prev
      if(galleryList && galleryList.length>1){
        var next = new Image(), prev = new Image();
        next.src = galleryList[(galleryIndex+1)%galleryList.length];
        prev.src = galleryList[(galleryIndex-1+galleryList.length)%galleryList.length];
      }
    }

    function buildThumbs(){
      if(!thumbs) return;
      thumbs.innerHTML = '';
      if(galleryList && galleryList.length>1){
        thumbs.style.display = '';
        galleryList.forEach(function(src, i){
          var btn = document.createElement('button'); btn.className='thumb'; btn.setAttribute('aria-label','Go to image '+(i+1));
          var im = document.createElement('img'); im.src = src; im.loading='lazy';
          if(i===galleryIndex) im.classList.add('active');
          btn.appendChild(im);
          btn.addEventListener('click', function(e){
            e.preventDefault(); galleryIndex = i; render(galleryList[galleryIndex]); highlightThumb(); updateCounter();
          });
          thumbs.appendChild(btn);
        });
      } else {
        thumbs.style.display = 'none';
      }
    }

    function highlightThumb(){
      if(!thumbs) return;
      $all('img', thumbs).forEach(function(im, i){
        if(i===galleryIndex) im.classList.add('active'); else im.classList.remove('active');
      });
    }

    function showNav(show){
      ensureUI();
      if(prevBtn && nextBtn){
        prevBtn.style.display = show ? '' : 'none';
        nextBtn.style.display = show ? '' : 'none';
      }
      if(thumbs){ thumbs.style.display = show ? '' : 'none'; }
      if(countEl){ countEl.style.display = show ? '' : 'none'; }
    }

    function openImageLightbox(arg, startIndex){
      ensureUI();
      if(!imgBox) return;
      if(Array.isArray(arg)){
        galleryList = arg.slice();
        galleryIndex = Math.max(0, Math.min(arg.length-1, startIndex||0));
        render(galleryList[galleryIndex]);
        showNav(true); buildThumbs(); highlightThumb(); updateCounter();
      } else {
        galleryList = null;
        render(arg);
        showNav(false);
      }
      imgBox.hidden=false; lockScroll(true);
    }

    function closeImageLightbox(){ if(!imgBox) return; imgBox.hidden=true; lockScroll(false); }

    function step(delta){
      if(!galleryList || galleryList.length<2) return;
      galleryIndex = (galleryIndex + delta + galleryList.length) % galleryList.length;
      render(galleryList[galleryIndex]); highlightThumb(); updateCounter();
    }

    // Close handlers
    document.addEventListener('click', function(e){
      if(e.target && (e.target.getAttribute('data-close')==='1' || e.target.id==='img-backdrop' || e.target.id==='img-close')){
        e.preventDefault(); closeImageLightbox();
      }
    });
    document.addEventListener('keydown', function(e){
      if(imgBox && !imgBox.hidden && galleryList && galleryList.length>1){
        if(e.key==='ArrowLeft'){ e.preventDefault(); step(-1); }
        if(e.key==='ArrowRight'){ e.preventDefault(); step(1); }
      }
    });

    // ---------- Video Modal ----------
    var videoModal = $('#videoModal');
    var videoEl = $('#surveyVideo');
    function openVideoModal(src){
      if(videoEl){ videoEl.src = src; try{ videoEl.load(); videoEl.play(); }catch(e){} }
      if(videoModal){ videoModal.hidden=false; lockScroll(true); }
    }
    function closeVideoModal(){
      if(videoEl){ try{ videoEl.pause(); }catch(e){} videoEl.currentTime = 0; }
      if(videoModal){ videoModal.hidden=true; lockScroll(false); }
    }
    document.addEventListener('click', function(e){
      if(e.target && e.target.classList && e.target.classList.contains('video-modal-close')){ e.preventDefault(); closeVideoModal(); }
      if(e.target && e.target.id==='videoModal'){ closeVideoModal(); }
    });

    // ---------- Card handler ----------
    // Fast, static lists for speed:
    var SNAPSHOT_LIST = Array.from({length:16}, function(_,i){ return 'images/' + String(i+1).padStart(2,'0') + '.jpg'; });
    var REPORT_LIST   = [
      'images/SampleInspectionReport_page1_small.jpg',
      'images/SampleInspectionReport_page2_small.jpg',
      'images/SampleInspectionReport_page3_small.jpg',
      'images/SampleInspectionReport_page4_small.jpg'
    ];

    function parseInline(li){
      var oc = li.getAttribute('onclick') || '';
      if(/openSnapshotGallery/.test(oc)) return {action:'snapshot', idx:0};
      if(/openReportGallery/.test(oc)) return {action:'report', idx:0};
      var mV = oc.match(/openVideoModal\('([^']+)'/); if(mV) return {action:'video', src:mV[1]};
      var mI = oc.match(/openImageLightbox\('([^']+)'/); if(mI) return {action:'image', src:mI[1]};
      var img = li.querySelector('.service-image img'); if(img && img.getAttribute('src')) return {action:'image', src: img.getAttribute('src')};
      return null;
    }

    async function handleCard(li){
      // Title fallback to infer action
      var action = li.getAttribute('data-action');
      var src = li.getAttribute('data-src');
      var idx = parseInt(li.getAttribute('data-index')||'0',10);
      try{
        if(!action){
          var titleEl = li.querySelector('.service-details h1, .service-details h2, .service-details h3, .service-details h4, .service-details h5');
          var titleTxt = titleEl ? titleEl.textContent.trim().toLowerCase() : '';
          if(titleTxt.indexOf('roof snapshot') !== -1){ action='snapshot'; }
          else if(titleTxt.indexOf('detailed roof report') !== -1){ action='report'; }
        }
      }catch(e){}

      if(!action){
        var parsed = parseInline(li) || {};
        action = parsed.action; src = src || parsed.src; idx = isNaN(idx) ? (parsed.idx||0) : idx;
      }

      if(action === 'snapshot'){ openImageLightbox(SNAPSHOT_LIST, idx||0); return; }
      if(action === 'report'){ if(REPORT_LIST && REPORT_LIST.length>1){ openImageLightbox(REPORT_LIST, 0); } else { openImageLightbox('images/two.jpg', 0); } return; }
      if(action === 'video' && src){ openVideoModal(src); return; }
      if(action === 'image' && src){ openImageLightbox(src, 0); return; }
    }

    // Bind clicks to cards
    $all('ul.serviceList li.report-card').forEach(function(li){
      li.addEventListener('click', function(){ handleCard(li); });
      var activator = li.querySelector('a.card-activator');
      if(activator){ activator.addEventListener('click', function(e){ e.preventDefault(); handleCard(li); }); }
      var small = li.querySelector('.service-image .hoverlink a');
      if(small){ small.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); }); }
    });

    // Expose for any legacy calls
    window.openImageLightbox   = function(arg, start){ openImageLightbox(arg, start||0); };
    window.openVideoModal      = function(src){ openVideoModal(src); };
    window.closeVideoModal     = function(){ closeVideoModal(); };
    window.openSnapshotGallery = function(i){ openImageLightbox(SNAPSHOT_LIST, i||0); };
    window.openReportGallery   = function(i){ if(REPORT_LIST && REPORT_LIST.length>1) openImageLightbox(REPORT_LIST, i||0); else openImageLightbox('images/two.jpg', 0); };

    console.log('[app.js] loaded: modals + galleries wired');
  });
})();
