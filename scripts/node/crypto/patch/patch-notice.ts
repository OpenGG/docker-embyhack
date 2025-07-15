// --- NOTICE HTML & CSS ---
const noticeHTML = `
      <div class="emby-drawer-notice">
          <div class="notice-content">
              <strong class="notice-title">Support Emby with your love</strong>
              <p>
                  <a href="https://emby.media/premiere.html" target="_blank" rel="noopener noreferrer">Buy Emby Premiere</a> to unlock great features and support development.
              </p>
          </div>
          <button class="emby-notice-toggle-btn" title="Collapse/Expand">
              <svg class="icon-expand" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              <svg class="icon-collapse" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>
          </button>
      </div>
  `;

const noticeCSS = `
      .emby-drawer-notice {
          position: fixed;
          top: 80px;
          right: 50px;
          width: 300px;
          height: 130px; /* Increased height for title */
          background-color: #1c1c1e;
          color: #fff;
          z-index: 99999;
          border-radius: 10px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
          display: none; /* Hidden by default */
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 14px;
          border: 1px solid #333;
          cursor: move;
      }
      /* Use a CSS descendant selector instead of JS to show the notice */
      /* html.withFullDrawer .emby-drawer-notice {
          display: block;
      } */
      .emby-drawer-notice.dragging {
          transition: none;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      }
      .emby-drawer-notice .notice-content {
          padding: 15px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 100%;
          box-sizing: border-box;
          transition: opacity 0.2s ease-in-out 0.15s;
      }
      .notice-title {
          font-size: 16px;
          font-weight: bold;
          color: #fff;
          margin: 0 0 8px 0;
      }
      .emby-drawer-notice .notice-content p {
          margin: 0;
          line-height: 1.5;
          color: #ccc;
      }
      .emby-drawer-notice .notice-content a {
          color: #00a4dc;
          text-decoration: none;
          font-weight: bold;
          cursor: pointer;
      }
      .emby-drawer-notice .notice-content a:hover {
          text-decoration: underline;
      }
      .emby-notice-toggle-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 30px;
          height: 30px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          padding: 0;
      }
      .emby-notice-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.2);
      }
      .emby-notice-toggle-btn svg {
          width: 18px;
          height: 18px;
      }
      .emby-notice-toggle-btn .icon-expand { display: none; }
      .emby-notice-toggle-btn .icon-collapse { display: block; }

      /* Collapsed State */
      .emby-drawer-notice.collapsed {
          width: 50px;
          height: 50px;
      }
      .emby-drawer-notice.collapsed .notice-content {
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.1s ease-in-out; /* No delay on collapse */
      }
      .emby-drawer-notice.collapsed .emby-notice-toggle-btn .icon-expand { display: block; }
      .emby-drawer-notice.collapsed .emby-notice-toggle-btn .icon-collapse { display: none; }
  `;

// --- SCRIPT LOGIC ---

function initializeNotice(): void {
  if (document.querySelector('.emby-drawer-notice')) {
    return;
  }

  const styleSheet = document.createElement("style");
  styleSheet.innerText = noticeCSS;
  (document.head || document.documentElement).appendChild(styleSheet);

  const noticeContainer = document.createElement('div');
  noticeContainer.innerHTML = noticeHTML;
  const noticeEl = noticeContainer.firstElementChild;
  if (!noticeEl) {
    return;
  }
  const notice = noticeEl as HTMLDivElement;
  (document.body || document.documentElement).appendChild(notice);

  const toggleBtn = notice.querySelector<HTMLButtonElement>('.emby-notice-toggle-btn');
  const link = notice.querySelector<HTMLAnchorElement>('a')!

  if (!toggleBtn || !link) return;

  let startX: number, startY: number;

  toggleBtn.addEventListener('click', (e: MouseEvent) => {
    const travelX = Math.abs(e.clientX - startX);
    const travelY = Math.abs(e.clientY - startY);
    if (travelX > 5 || travelY > 5) {
      return;
    }
    e.stopPropagation();
    notice.classList.toggle('collapsed');
  });

  let initialRight: number, initialTop: number;
  let initialMouseX: number, initialMouseY: number;

  function onMouseDown(e: MouseEvent): void {
    if (e.target === link || (e.target instanceof Node && link.contains(e.target))) {
      return;
    }

    startX = e.clientX;
    startY = e.clientY;

    notice.style.userSelect = 'none';
    notice.classList.add('dragging');

    initialRight = parseInt(getComputedStyle(notice).right, 10);
    initialTop = parseInt(getComputedStyle(notice).top, 10);
    initialMouseX = e.clientX;
    initialMouseY = e.clientY;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(e: MouseEvent): void {
    e.preventDefault();

    const dx = e.clientX - initialMouseX;
    const dy = e.clientY - initialMouseY;

    let newRight = initialRight - dx;
    let newTop = initialTop + dy;

    const marginX = 50;
    const marginY = 80;
    const minRight = marginX;
    const maxRight = window.innerWidth - notice.offsetWidth - marginX;
    const minTop = marginY;
    const maxTop = window.innerHeight - notice.offsetHeight - marginY;

    newRight = Math.max(minRight, Math.min(newRight, maxRight));
    newTop = Math.max(minTop, Math.min(newTop, maxTop));

    notice.style.right = `${newRight}px`;
    notice.style.top = `${newTop}px`;
  }

  function onMouseUp(): void {
    notice.style.userSelect = 'auto';
    notice.classList.remove('dragging');
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  notice.addEventListener('mousedown', onMouseDown);


  // Emby.Page.getRoutes().filter(a => a.settingsTheme).map(a => a.path).join(',')
  const settingsRoutes = '/settings,/settings/keyboard.html,/settings/notifications.html,/settings/playback.html,/settings/appgeneral.html,/settings/appplayback.html,/settings/subtitles.html,/settings/display.html,/settings/homescreen.html,/settings/profile.html,/plugins/install,/database,/dashboard,/dashboard.html,/dashboard/settings,/devices,/network,/devices/device.html,/devices/cameraupload.html,/transcoding,/librarysetup,/livetvsetup,/livetvsetup/guideprovider.html,/livetvsetup/livetvtuner.html,/logs,/log,/plugins,/dashboard/releasenotes.html,/scheduledtasks,/scheduledtask,/serveractivity,/apikeys,/embypremiere,/serverdownloads,/conversions,/users/user,/users/new,/users,/wizard/wizardagreement.html,/wizard/wizardremoteaccess.html,/wizard/wizardfinish.html,/wizard/wizardlibrary.html,/wizard/wizardstart.html,/wizard/wizarduser.html,/configurationpage,/genericui'
    .split(',')

  // Function to be called when the hash is '#a'
  function openNotice() {
    // Add your code here to display the notice
    notice.style.display = 'block'
  }

  // Function to be called for any other hash
  function closeNotice() {
    // Add your code here to hide the notice
    notice.style.display = 'none'
  }

  // Function to check the hash and call the appropriate function
  function handleHashChange() {
    const route = location.hash.replace(/^#!/, '').replace(/\?.*/, '')
    const shouldShowNotice = settingsRoutes.includes(route)
    if (shouldShowNotice) {
      openNotice();
    } else {
      closeNotice();
    }
  }

  // --- The Event Listeners & Hooks ---

  // 1. Listen for user navigation (back/forward buttons) and direct hash changes
  window.addEventListener('popstate', handleHashChange);
  window.addEventListener('hashchange', handleHashChange);

  // 2. Hook pushState and replaceState to catch programmatic changes
  ['pushState', 'replaceState'].forEach((method) => {
    const original = history[method];
    history[method] = function (...args) {
      // Call the original browser method
      original.apply(history, args);
      // Manually trigger our handler
      handleHashChange();
    };
  });

  // 3. Call the function on initial page load to check the current URL
  handleHashChange();
}

// --- INITIALIZATION ---
// Run immediately. The CSS now handles visibility, so no observer is needed.
initializeNotice();
