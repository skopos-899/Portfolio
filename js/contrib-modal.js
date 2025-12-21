// Simple accessible modal for contribution day details
(function () {
    function createModal() {
        const overlay = document.createElement('div');
        overlay.className = 'contrib-modal-overlay';
        overlay.tabIndex = -1;

        const dlg = document.createElement('div');
        dlg.className = 'contrib-modal';
        dlg.setAttribute('role', 'dialog');
        dlg.setAttribute('aria-modal', 'true');
        dlg.innerHTML = `
            <div class="contrib-modal-header">
                <h3 class="contrib-modal-title">Date</h3>
                <button class="contrib-modal-close" aria-label="Close">✕</button>
            </div>
            <div class="contrib-modal-body"></div>
        `;

        overlay.appendChild(dlg);
        document.body.appendChild(overlay);

        // Close handlers
        function close() {
            overlay.classList.remove('open');
            document.body.classList.remove('no-scroll');
            overlay.querySelector('.contrib-modal-body').innerHTML = '';
            window.removeEventListener('keydown', onKeyDown);
        }

        function open(title, items) {
            const titleEl = overlay.querySelector('.contrib-modal-title');
            const body = overlay.querySelector('.contrib-modal-body');
            titleEl.textContent = title;
            body.innerHTML = '';

            if (!items || items.length === 0) {
                body.innerHTML = '<p>No projects for this date.</p>';
            } else {
                const list = document.createElement('div');
                list.className = 'contrib-modal-list';
                items.forEach(p => {
                    const card = document.createElement('div');
                    card.className = 'contrib-modal-item';
                    card.innerHTML = `
                        <h4 class="cm-item-title">${escapeHtml(p.name || p['Project Name'] || '(untitled)')}</h4>
                        <div class="cm-item-meta">${escapeHtml(p.category || p.Category || '')} ${p.status ? `<span class="cm-item-status">${escapeHtml(p.status)}</span>` : ''}</div>
                        <p class="cm-item-desc">${escapeHtml(p.description || p.Description || '')}</p>
                        ${p.link ? `<a href="${escapeAttr(p.link)}" target="_blank" rel="noopener" class="cm-item-link">View project</a>` : ''}
                    `;
                    list.appendChild(card);
                });
                body.appendChild(list);
            }

            overlay.classList.add('open');
            document.body.classList.add('no-scroll');
            // focus the close button
            const closeBtn = overlay.querySelector('.contrib-modal-close');
            closeBtn.focus();
            window.addEventListener('keydown', onKeyDown);
        }

        function onKeyDown(e) {
            if (e.key === 'Escape') close();
        }

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
        overlay.querySelector('.contrib-modal-close').addEventListener('click', close);

        return { open, close };
    }

    function escapeHtml(s) {
        if (!s) return '';
        return String(s).replace(/[&<>"']/g, function (c) {
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c];
        });
    }

    function escapeAttr(s) {
        return escapeHtml(s).replace(/"/g, '%22');
    }

    const modal = createModal();

    // Listen for contribution open events
    window.addEventListener('contrib:open', (e) => {
        const detail = e.detail || {};
        const date = detail.date || '';
        const items = Array.isArray(detail.projects) ? detail.projects : [];
        modal.open(date, items);
    });

})();
