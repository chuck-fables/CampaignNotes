// Campaign Notes App - Main JavaScript

// ============================================
// DATA MANAGEMENT
// ============================================

const STORAGE_KEY = 'campaignNotesData';

// Default data structure
const defaultData = {
    tabs: [
        {
            id: 'tab-1',
            name: 'General',
            order: 0
        }
    ],
    folders: [
        {
            id: 'folder-1',
            name: 'My Notes',
            tabId: 'tab-1',
            collapsed: false
        }
    ],
    notes: [],
    activeTabId: 'tab-1',
    viewMode: 'grid' // 'grid' or 'list'
};

// Load data from localStorage
function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const data = JSON.parse(stored);
            // Ensure all required properties exist
            return {
                ...defaultData,
                ...data,
                tabs: data.tabs || defaultData.tabs,
                folders: data.folders || defaultData.folders,
                notes: data.notes || defaultData.notes
            };
        } catch (e) {
            console.error('Error loading data:', e);
            return { ...defaultData };
        }
    }
    return { ...defaultData };
}

// Save data to localStorage
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

// App state
let appData = loadData();

// ============================================
// ICON PATHS
// ============================================

const ICONS = {
    folder: 'vintage icons/files_vintage.webp',
    tabs: 'vintage icons/tabs_vintage.webp',
    note: 'vintage icons/pen_vintage.webp'
};

// ============================================
// COLOR PALETTE
// ============================================

const TEXT_COLORS = [
    '#ffffff', '#cccccc', '#999999', '#666666', '#333333', '#000000',
    '#ff6b6b', '#ee5a5a', '#cc4444', '#ff8c42', '#ffa94d', '#ffd43b',
    '#69db7c', '#51cf66', '#40c057', '#38d9a9', '#20c997', '#12b886',
    '#74c0fc', '#4dabf7', '#339af0', '#748ffc', '#5c7cfa', '#4c6ef5',
    '#da77f2', '#cc5de8', '#be4bdb', '#f783ac', '#f06595', '#e64980'
];

const HIGHLIGHT_COLORS = [
    'transparent', '#ffeb3b', '#ffcc02', '#ff9800', '#ff5722', '#f44336',
    '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4',
    '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b'
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

// ============================================
// DOM ELEMENTS
// ============================================

const elements = {
    tabsContainer: document.getElementById('tabsContainer'),
    mainContent: document.getElementById('mainContent'),
    addBtn: document.getElementById('addBtn'),
    fabBtn: document.getElementById('fabBtn'),
    gridViewBtn: document.getElementById('gridViewBtn'),
    listViewBtn: document.getElementById('listViewBtn'),
    // Modals
    addModal: document.getElementById('addModal'),
    noteModal: document.getElementById('noteModal'),
    previewModal: document.getElementById('previewModal'),
    optionsModal: document.getElementById('optionsModal'),
    moveModal: document.getElementById('moveModal'),
    deleteModal: document.getElementById('deleteModal'),
    inputModal: document.getElementById('inputModal'),
    // Note editor
    noteTitleInput: document.getElementById('noteTitleInput'),
    noteContentEditor: document.getElementById('noteContentEditor'),
    noteSaveBtn: document.getElementById('noteSaveBtn'),
    noteCancelBtn: document.getElementById('noteCancelBtn'),
    fullscreenToggle: document.getElementById('fullscreenToggle'),
    // Font selector
    fontSelectorBtn: document.getElementById('fontSelectorBtn'),
    fontDropdown: document.getElementById('fontDropdown'),
    currentFont: document.getElementById('currentFont'),
    // Color pickers
    textColorBtn: document.getElementById('textColorBtn'),
    textColorDropdown: document.getElementById('textColorDropdown'),
    textColorGrid: document.getElementById('textColorGrid'),
    textColorIndicator: document.getElementById('textColorIndicator'),
    highlightBtn: document.getElementById('highlightBtn'),
    highlightDropdown: document.getElementById('highlightDropdown'),
    highlightColorGrid: document.getElementById('highlightColorGrid'),
    // Preview
    previewTitle: document.getElementById('previewTitle'),
    previewContent: document.getElementById('previewContent'),
    previewCloseBtn: document.getElementById('previewCloseBtn'),
    previewEditBtn: document.getElementById('previewEditBtn'),
    // Options
    optionsTitle: document.getElementById('optionsTitle'),
    optionsContent: document.getElementById('optionsContent'),
    // Move
    moveTitle: document.getElementById('moveTitle'),
    moveOptions: document.getElementById('moveOptions'),
    // Delete
    deleteMessage: document.getElementById('deleteMessage'),
    deleteConfirmBtn: document.getElementById('deleteConfirmBtn'),
    deleteCancelBtn: document.getElementById('deleteCancelBtn'),
    // Input
    inputTitle: document.getElementById('inputTitle'),
    inputField: document.getElementById('inputField'),
    inputSaveBtn: document.getElementById('inputSaveBtn'),
    inputCancelBtn: document.getElementById('inputCancelBtn')
};

// ============================================
// MODAL MANAGEMENT
// ============================================

function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
    // Close all dropdowns
    closeAllDropdowns();
}

function closeAllDropdowns() {
    document.querySelectorAll('.color-dropdown, .font-dropdown').forEach(d => {
        d.classList.remove('active');
    });
}

// Close modal on backdrop click
document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', closeAllModals);
});

// Close modal on cancel button
document.querySelectorAll('.modal-cancel').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
});

// ============================================
// RICH TEXT EDITOR
// ============================================

let currentEditorFont = 'garamond';
let savedSelection = null;

// Save the current selection
function saveSelection() {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
        savedSelection = sel.getRangeAt(0).cloneRange();
    }
}

// Restore the saved selection
function restoreSelection() {
    if (savedSelection) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedSelection);
    }
}

// Apply color to selected text using span wrapping
function applyTextColor(color) {
    restoreSelection();
    const sel = window.getSelection();
    if (sel.rangeCount > 0 && !sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        const span = document.createElement('span');
        span.style.color = color;
        try {
            range.surroundContents(span);
        } catch (e) {
            // If surroundContents fails (e.g., selection crosses element boundaries)
            document.execCommand('foreColor', false, color);
        }
    }
    elements.noteContentEditor.focus();
}

// Apply highlight to selected text
function applyHighlight(color) {
    restoreSelection();
    const sel = window.getSelection();
    if (sel.rangeCount > 0 && !sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        if (color === 'transparent') {
            // Remove highlight by extracting contents
            const span = document.createElement('span');
            span.style.backgroundColor = 'transparent';
            try {
                range.surroundContents(span);
            } catch (e) {
                document.execCommand('hiliteColor', false, 'transparent');
            }
        } else {
            const span = document.createElement('span');
            span.style.backgroundColor = color;
            try {
                range.surroundContents(span);
            } catch (e) {
                document.execCommand('hiliteColor', false, color);
            }
        }
    }
    elements.noteContentEditor.focus();
}

// Initialize color grids
function initColorPickers() {
    // Text colors
    elements.textColorGrid.innerHTML = TEXT_COLORS.map(color => `
        <div class="color-swatch" style="background: ${color};" data-color="${color}"></div>
    `).join('');

    // Highlight colors
    elements.highlightColorGrid.innerHTML = HIGHLIGHT_COLORS.map(color => `
        <div class="color-swatch" style="background: ${color === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)' : color}; background-size: 8px 8px; background-position: 0 0, 4px 4px;" data-color="${color}"></div>
    `).join('');

    // Text color click handlers
    elements.textColorGrid.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent losing focus
        });
        swatch.addEventListener('click', (e) => {
            e.preventDefault();
            const color = swatch.dataset.color;
            applyTextColor(color);
            elements.textColorIndicator.style.background = color;
            closeAllDropdowns();
        });
    });

    // Highlight color click handlers
    elements.highlightColorGrid.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent losing focus
        });
        swatch.addEventListener('click', (e) => {
            e.preventDefault();
            const color = swatch.dataset.color;
            applyHighlight(color);
            closeAllDropdowns();
        });
    });
}

// Save selection when editor loses focus or before opening dropdowns
elements.noteContentEditor.addEventListener('mouseup', saveSelection);
elements.noteContentEditor.addEventListener('keyup', saveSelection);

// Toggle dropdowns
elements.textColorBtn.addEventListener('mousedown', (e) => {
    e.preventDefault(); // Prevent losing focus
    saveSelection();
});
elements.textColorBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isActive = elements.textColorDropdown.classList.contains('active');
    closeAllDropdowns();
    if (!isActive) {
        elements.textColorDropdown.classList.add('active');
    }
});

elements.highlightBtn.addEventListener('mousedown', (e) => {
    e.preventDefault(); // Prevent losing focus
    saveSelection();
});
elements.highlightBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isActive = elements.highlightDropdown.classList.contains('active');
    closeAllDropdowns();
    if (!isActive) {
        elements.highlightDropdown.classList.add('active');
    }
});

elements.fontSelectorBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isActive = elements.fontDropdown.classList.contains('active');
    closeAllDropdowns();
    if (!isActive) {
        elements.fontDropdown.classList.add('active');
    }
});

// Font selection
elements.fontDropdown.querySelectorAll('.font-option').forEach(option => {
    option.addEventListener('click', () => {
        const font = option.dataset.font;
        setEditorFont(font);
        closeAllDropdowns();
    });
});

function setEditorFont(font) {
    currentEditorFont = font;
    // Remove all font classes
    elements.noteContentEditor.className = 'note-content-editor';
    elements.noteContentEditor.classList.add(`font-${font}`);
    // Update button text
    const fontNames = {
        'garamond': 'Garamond',
        'arial': 'Arial',
        'times': 'Times New Roman',
        'courier': 'Courier New',
        'georgia': 'Georgia',
        'verdana': 'Verdana',
        'trebuchet': 'Trebuchet MS',
        'palatino': 'Palatino'
    };
    elements.currentFont.textContent = fontNames[font] || font;
    // Update active state
    elements.fontDropdown.querySelectorAll('.font-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.font === font);
    });
}

// Toolbar button handlers
document.querySelectorAll('.toolbar-btn[data-command]').forEach(btn => {
    btn.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevent losing focus
    });
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const command = btn.dataset.command;
        const value = btn.dataset.value || null;

        if (command === 'formatBlock' && value) {
            document.execCommand(command, false, `<${value}>`);
        } else {
            document.execCommand(command, false, value);
        }
        elements.noteContentEditor.focus();
    });
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.color-picker-wrapper') && !e.target.closest('.font-selector')) {
        closeAllDropdowns();
    }
});

// Keyboard shortcuts in editor
elements.noteContentEditor.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
            case 'b':
                e.preventDefault();
                document.execCommand('bold', false, null);
                break;
            case 'i':
                e.preventDefault();
                document.execCommand('italic', false, null);
                break;
            case 'u':
                e.preventDefault();
                document.execCommand('underline', false, null);
                break;
        }
    }
});

// Initialize color pickers
initColorPickers();

// ============================================
// RENDER FUNCTIONS
// ============================================

function renderTabs() {
    const tabs = appData.tabs.sort((a, b) => a.order - b.order);

    elements.tabsContainer.innerHTML = tabs.map(tab => `
        <div class="tab ${tab.id === appData.activeTabId ? 'active' : ''}"
             data-tab-id="${tab.id}"
             draggable="true">
            <img src="${ICONS.tabs}" alt="" class="icon-img small">
            <span class="tab-name">${escapeHtml(tab.name)}</span>
            ${tab.id === appData.activeTabId ? `
                <button class="tab-settings-btn" data-action="tab-settings" title="Tab Settings">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                </button>
            ` : ''}
        </div>
    `).join('');

    // Add event listeners
    elements.tabsContainer.querySelectorAll('.tab').forEach(tabEl => {
        const tabId = tabEl.dataset.tabId;

        // Click to select (but not on settings button)
        tabEl.addEventListener('click', (e) => {
            if (!tabEl.classList.contains('dragging') && !e.target.closest('.tab-settings-btn')) {
                setActiveTab(tabId);
            }
        });

        // Settings button click
        const settingsBtn = tabEl.querySelector('.tab-settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showTabOptions(tabId);
            });
        }

        // Right click for options (desktop)
        tabEl.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showTabOptions(tabId);
        });

        // Drag and drop
        tabEl.addEventListener('dragstart', (e) => handleTabDragStart(e, tabId));
        tabEl.addEventListener('dragend', handleTabDragEnd);
        tabEl.addEventListener('dragover', (e) => handleTabDragOver(e, tabId));
        tabEl.addEventListener('drop', (e) => handleTabDrop(e, tabId));
    });
}

function renderFolders() {
    const folders = appData.folders
        .filter(f => f.tabId === appData.activeTabId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (folders.length === 0) {
        elements.mainContent.innerHTML = `
            <div class="empty-state">
                <img src="${ICONS.folder}" alt="" class="empty-state-icon">
                <p>No folders in this tab</p>
                <p>Tap the + button to create one</p>
            </div>
        `;
        return;
    }

    elements.mainContent.innerHTML = folders.map(folder => {
        const notes = appData.notes.filter(n => n.folderId === folder.id);
        return `
            <div class="folder" data-folder-id="${folder.id}">
                <div class="folder-header" draggable="true">
                    <button class="folder-collapse ${folder.collapsed ? 'collapsed' : ''}" data-action="toggle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                    <div class="folder-drag-handle" title="Drag to reorder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <line x1="8" y1="6" x2="16" y2="6"></line>
                            <line x1="8" y1="12" x2="16" y2="12"></line>
                            <line x1="8" y1="18" x2="16" y2="18"></line>
                        </svg>
                    </div>
                    <img src="${ICONS.folder}" alt="" class="folder-icon">
                    <span class="folder-name">${escapeHtml(folder.name)}</span>
                    <button class="folder-options" data-action="options">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                        </svg>
                    </button>
                </div>
                <div class="folder-content ${folder.collapsed ? 'collapsed' : ''}">
                    <div class="notes-grid ${appData.viewMode === 'list' ? 'list-view' : ''}">
                        ${notes.length === 0 ? `
                            <div class="empty-state" style="grid-column: 1/-1;">
                                <p style="font-size: 14px; color: var(--text-secondary);">No notes yet</p>
                            </div>
                        ` : notes.map(note => `
                            <div class="note-card ${appData.viewMode === 'list' ? 'list-view' : ''}" data-note-id="${note.id}" draggable="true">
                                <button class="note-options" data-action="options">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                        <circle cx="12" cy="12" r="1"></circle>
                                        <circle cx="12" cy="5" r="1"></circle>
                                        <circle cx="12" cy="19" r="1"></circle>
                                    </svg>
                                </button>
                                <div class="note-title">
                                    <img src="${ICONS.note}" alt="" class="icon-img small">
                                    <span>${escapeHtml(note.title || 'Untitled')}</span>
                                </div>
                                <div class="note-preview">${escapeHtml(stripHtml(note.content || ''))}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners for folders
    elements.mainContent.querySelectorAll('.folder').forEach(folderEl => {
        const folderId = folderEl.dataset.folderId;
        const folderHeader = folderEl.querySelector('.folder-header');

        // Toggle collapse - clicking anywhere on the folder header (except options and drag handle)
        folderHeader.addEventListener('click', (e) => {
            if (!e.target.closest('.folder-options') && !e.target.closest('.folder-drag-handle')) {
                toggleFolderCollapse(folderId);
            }
        });

        // Folder options
        folderEl.querySelector('[data-action="options"]').addEventListener('click', (e) => {
            e.stopPropagation();
            showFolderOptions(folderId);
        });

        // Folder drag and drop (for reordering folders)
        folderHeader.addEventListener('dragstart', (e) => {
            // Only allow folder drag from the drag handle
            if (e.target.closest('.folder-drag-handle')) {
                handleFolderDragStart(e, folderId);
            } else {
                e.preventDefault();
            }
        });
        folderHeader.addEventListener('dragend', handleFolderDragEnd);

        // Folder as drop target (for both folders and notes)
        folderEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (draggedFolderId && draggedFolderId !== folderId) {
                folderEl.classList.add('drag-over');
            }
            if (draggedNoteId) {
                const note = appData.notes.find(n => n.id === draggedNoteId);
                if (note && note.folderId !== folderId) {
                    folderEl.classList.add('note-drag-over');
                }
            }
        });
        folderEl.addEventListener('dragleave', (e) => {
            folderEl.classList.remove('drag-over');
            folderEl.classList.remove('note-drag-over');
        });
        folderEl.addEventListener('drop', (e) => {
            e.preventDefault();
            folderEl.classList.remove('drag-over');
            folderEl.classList.remove('note-drag-over');

            // Handle folder drop
            if (draggedFolderId && draggedFolderId !== folderId) {
                handleFolderDrop(e, folderId);
            }
            // Handle note drop
            if (draggedNoteId) {
                handleNoteDropOnFolder(e, folderId);
            }
        });

        // Touch drag for mobile folders
        let folderTouchStartY = 0;
        let isFolderDragging = false;

        const dragHandle = folderHeader.querySelector('.folder-drag-handle');
        if (dragHandle) {
            dragHandle.addEventListener('touchstart', (e) => {
                folderTouchStartY = e.touches[0].clientY;
                e.stopPropagation();
            }, { passive: true });

            dragHandle.addEventListener('touchmove', (e) => {
                const touchY = e.touches[0].clientY;
                const diff = Math.abs(touchY - folderTouchStartY);
                if (diff > 10 && !isFolderDragging) {
                    isFolderDragging = true;
                    draggedFolderId = folderId;
                    folderEl.classList.add('dragging');
                }
            }, { passive: true });

            dragHandle.addEventListener('touchend', (e) => {
                if (isFolderDragging) {
                    isFolderDragging = false;
                    folderEl.classList.remove('dragging');
                    const touch = e.changedTouches[0];
                    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                    const targetFolder = elementBelow?.closest('.folder');
                    if (targetFolder && targetFolder !== folderEl) {
                        const targetFolderId = targetFolder.dataset.folderId;
                        handleFolderDrop({ preventDefault: () => {}, currentTarget: targetFolder }, targetFolderId);
                    }
                    draggedFolderId = null;
                }
            });
        }

        // Note events
        folderEl.querySelectorAll('.note-card').forEach(noteEl => {
            const noteId = noteEl.dataset.noteId;

            // Click to preview (but not when dragging)
            noteEl.addEventListener('click', (e) => {
                if (!e.target.closest('.note-options') && !noteEl.classList.contains('dragging')) {
                    openNotePreview(noteId);
                }
            });

            // Note options
            noteEl.querySelector('[data-action="options"]').addEventListener('click', (e) => {
                e.stopPropagation();
                showNoteOptions(noteId);
            });

            // Note drag and drop
            noteEl.addEventListener('dragstart', (e) => handleNoteDragStart(e, noteId));
            noteEl.addEventListener('dragend', handleNoteDragEnd);

            // Touch drag for mobile notes
            let noteTouchStartX = 0;
            let noteTouchStartY = 0;
            let isNoteDragging = false;

            noteEl.addEventListener('touchstart', (e) => {
                noteTouchStartX = e.touches[0].clientX;
                noteTouchStartY = e.touches[0].clientY;
            }, { passive: true });

            noteEl.addEventListener('touchmove', (e) => {
                const touchX = e.touches[0].clientX;
                const touchY = e.touches[0].clientY;
                const diffX = Math.abs(touchX - noteTouchStartX);
                const diffY = Math.abs(touchY - noteTouchStartY);
                if ((diffX > 15 || diffY > 15) && !isNoteDragging) {
                    isNoteDragging = true;
                    draggedNoteId = noteId;
                    noteEl.classList.add('dragging');
                    document.querySelectorAll('.folder').forEach(f => f.classList.add('note-drop-target'));
                }
            }, { passive: true });

            noteEl.addEventListener('touchend', (e) => {
                if (isNoteDragging) {
                    isNoteDragging = false;
                    noteEl.classList.remove('dragging');
                    document.querySelectorAll('.folder').forEach(f => {
                        f.classList.remove('note-drop-target');
                        f.classList.remove('note-drag-over');
                    });

                    const touch = e.changedTouches[0];
                    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                    const targetFolder = elementBelow?.closest('.folder');
                    if (targetFolder) {
                        const targetFolderId = targetFolder.dataset.folderId;
                        handleNoteDropOnFolder({ preventDefault: () => {}, currentTarget: targetFolder }, targetFolderId);
                    }
                    draggedNoteId = null;
                }
            });
        });
    });
}

function render() {
    renderTabs();
    renderFolders();
    updateViewButtons();
}

function updateViewButtons() {
    elements.gridViewBtn.classList.toggle('active', appData.viewMode === 'grid');
    elements.listViewBtn.classList.toggle('active', appData.viewMode === 'list');
}

// ============================================
// TAB OPERATIONS
// ============================================

function setActiveTab(tabId) {
    appData.activeTabId = tabId;
    saveData();
    render();
}

function createTab(name) {
    const maxOrder = Math.max(...appData.tabs.map(t => t.order), -1);
    const newTab = {
        id: generateId('tab'),
        name: name,
        order: maxOrder + 1
    };
    appData.tabs.push(newTab);
    appData.activeTabId = newTab.id;
    saveData();
    render();
}

function renameTab(tabId, newName) {
    const tab = appData.tabs.find(t => t.id === tabId);
    if (tab) {
        tab.name = newName;
        saveData();
        render();
    }
}

function deleteTab(tabId) {
    // Don't delete if it's the only tab
    if (appData.tabs.length <= 1) {
        alert('Cannot delete the only tab');
        return;
    }

    // Delete all folders and notes in this tab
    const folderIds = appData.folders.filter(f => f.tabId === tabId).map(f => f.id);
    appData.notes = appData.notes.filter(n => !folderIds.includes(n.folderId));
    appData.folders = appData.folders.filter(f => f.tabId !== tabId);
    appData.tabs = appData.tabs.filter(t => t.id !== tabId);

    // Set new active tab if needed
    if (appData.activeTabId === tabId) {
        appData.activeTabId = appData.tabs[0].id;
    }

    saveData();
    render();
}

function showTabOptions(tabId) {
    const tab = appData.tabs.find(t => t.id === tabId);
    if (!tab) return;

    elements.optionsTitle.textContent = `Tab: ${tab.name}`;
    elements.optionsContent.innerHTML = `
        <button class="modal-option" data-action="rename">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Rename Tab
        </button>
        <button class="modal-option" data-action="delete" style="color: var(--danger);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Delete Tab
        </button>
    `;

    elements.optionsContent.querySelector('[data-action="rename"]').addEventListener('click', () => {
        closeAllModals();
        showInputDialog('Rename Tab', tab.name, (newName) => {
            if (newName.trim()) {
                renameTab(tabId, newName.trim());
            }
        });
    });

    elements.optionsContent.querySelector('[data-action="delete"]').addEventListener('click', () => {
        closeAllModals();
        showDeleteConfirm(`Are you sure you want to delete the tab "${tab.name}" and all its contents?`, () => {
            deleteTab(tabId);
        });
    });

    openModal(elements.optionsModal);
}

// Tab drag and drop
let draggedTabId = null;

function handleTabDragStart(e, tabId) {
    draggedTabId = tabId;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleTabDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('drag-over'));
    draggedTabId = null;
}

function handleTabDragOver(e, tabId) {
    e.preventDefault();
    if (draggedTabId && draggedTabId !== tabId) {
        e.target.classList.add('drag-over');
    }
}

function handleTabDrop(e, targetTabId) {
    e.preventDefault();
    e.target.classList.remove('drag-over');

    if (!draggedTabId || draggedTabId === targetTabId) return;

    const tabs = appData.tabs.sort((a, b) => a.order - b.order);
    const draggedIndex = tabs.findIndex(t => t.id === draggedTabId);
    const targetIndex = tabs.findIndex(t => t.id === targetTabId);

    // Reorder
    const [draggedTab] = tabs.splice(draggedIndex, 1);
    tabs.splice(targetIndex, 0, draggedTab);

    // Update order values
    tabs.forEach((tab, index) => {
        tab.order = index;
    });

    saveData();
    render();
}

// Folder drag and drop
let draggedFolderId = null;

function handleFolderDragStart(e, folderId) {
    draggedFolderId = folderId;
    e.target.closest('.folder').classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleFolderDragEnd(e) {
    e.target.closest('.folder')?.classList.remove('dragging');
    document.querySelectorAll('.folder').forEach(f => f.classList.remove('drag-over'));
    draggedFolderId = null;
}

function handleFolderDragOver(e, folderId) {
    e.preventDefault();
    if (draggedFolderId && draggedFolderId !== folderId) {
        e.currentTarget.classList.add('drag-over');
    }
}

function handleFolderDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleFolderDrop(e, targetFolderId) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    if (!draggedFolderId || draggedFolderId === targetFolderId) return;

    const folders = appData.folders
        .filter(f => f.tabId === appData.activeTabId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    const draggedIndex = folders.findIndex(f => f.id === draggedFolderId);
    const targetIndex = folders.findIndex(f => f.id === targetFolderId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder
    const [draggedFolder] = folders.splice(draggedIndex, 1);
    folders.splice(targetIndex, 0, draggedFolder);

    // Update order values
    folders.forEach((folder, index) => {
        folder.order = index;
    });

    saveData();
    render();
}

// Note drag and drop (between folders)
let draggedNoteId = null;

function handleNoteDragStart(e, noteId) {
    draggedNoteId = noteId;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    // Add class to all folders to indicate they are drop targets
    document.querySelectorAll('.folder').forEach(f => f.classList.add('note-drop-target'));
}

function handleNoteDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.folder').forEach(f => {
        f.classList.remove('note-drop-target');
        f.classList.remove('note-drag-over');
    });
    draggedNoteId = null;
}

function handleNoteDragOverFolder(e, folderId) {
    e.preventDefault();
    if (draggedNoteId) {
        const note = appData.notes.find(n => n.id === draggedNoteId);
        if (note && note.folderId !== folderId) {
            e.currentTarget.classList.add('note-drag-over');
        }
    }
}

function handleNoteDragLeaveFolder(e) {
    e.currentTarget.classList.remove('note-drag-over');
}

function handleNoteDropOnFolder(e, targetFolderId) {
    e.preventDefault();
    e.currentTarget.classList.remove('note-drag-over');

    if (!draggedNoteId) return;

    const note = appData.notes.find(n => n.id === draggedNoteId);
    if (note && note.folderId !== targetFolderId) {
        note.folderId = targetFolderId;
        saveData();
        render();
    }
}

// ============================================
// FOLDER OPERATIONS
// ============================================

function createFolder(name) {
    const existingFolders = appData.folders.filter(f => f.tabId === appData.activeTabId);
    const maxOrder = existingFolders.length > 0
        ? Math.max(...existingFolders.map(f => f.order || 0))
        : -1;

    const newFolder = {
        id: generateId('folder'),
        name: name,
        tabId: appData.activeTabId,
        collapsed: false,
        order: maxOrder + 1
    };
    appData.folders.push(newFolder);
    saveData();
    render();
}

function renameFolder(folderId, newName) {
    const folder = appData.folders.find(f => f.id === folderId);
    if (folder) {
        folder.name = newName;
        saveData();
        render();
    }
}

function toggleFolderCollapse(folderId) {
    const folder = appData.folders.find(f => f.id === folderId);
    if (folder) {
        folder.collapsed = !folder.collapsed;
        saveData();
        render();
    }
}

function moveFolder(folderId, targetTabId) {
    const folder = appData.folders.find(f => f.id === folderId);
    if (folder && targetTabId !== folder.tabId) {
        folder.tabId = targetTabId;
        saveData();
        render();
    }
}

function deleteFolder(folderId) {
    // Delete all notes in this folder
    appData.notes = appData.notes.filter(n => n.folderId !== folderId);
    appData.folders = appData.folders.filter(f => f.id !== folderId);
    saveData();
    render();
}

function showFolderOptions(folderId) {
    const folder = appData.folders.find(f => f.id === folderId);
    if (!folder) return;

    elements.optionsTitle.textContent = `Folder: ${folder.name}`;
    elements.optionsContent.innerHTML = `
        <button class="modal-option" data-action="rename">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Rename Folder
        </button>
        <button class="modal-option" data-action="move">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Move to Tab
        </button>
        <button class="modal-option" data-action="delete" style="color: var(--danger);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Delete Folder
        </button>
    `;

    elements.optionsContent.querySelector('[data-action="rename"]').addEventListener('click', () => {
        closeAllModals();
        showInputDialog('Rename Folder', folder.name, (newName) => {
            if (newName.trim()) {
                renameFolder(folderId, newName.trim());
            }
        });
    });

    elements.optionsContent.querySelector('[data-action="move"]').addEventListener('click', () => {
        closeAllModals();
        showMoveToTab(folderId);
    });

    elements.optionsContent.querySelector('[data-action="delete"]').addEventListener('click', () => {
        closeAllModals();
        showDeleteConfirm(`Are you sure you want to delete the folder "${folder.name}" and all its notes?`, () => {
            deleteFolder(folderId);
        });
    });

    openModal(elements.optionsModal);
}

function showMoveToTab(folderId) {
    const folder = appData.folders.find(f => f.id === folderId);
    if (!folder) return;

    const otherTabs = appData.tabs.filter(t => t.id !== folder.tabId);

    if (otherTabs.length === 0) {
        alert('No other tabs to move to. Create a new tab first.');
        return;
    }

    elements.moveTitle.textContent = 'Move to Tab';
    elements.moveOptions.innerHTML = otherTabs.map(tab => `
        <button class="move-option" data-tab-id="${tab.id}">
            <img src="${ICONS.tabs}" alt="" class="icon-img"> ${escapeHtml(tab.name)}
        </button>
    `).join('');

    elements.moveOptions.querySelectorAll('.move-option').forEach(btn => {
        btn.addEventListener('click', () => {
            moveFolder(folderId, btn.dataset.tabId);
            closeAllModals();
        });
    });

    openModal(elements.moveModal);
}

// ============================================
// NOTE OPERATIONS
// ============================================

let currentEditingNoteId = null;
let currentNoteFolder = null;

function createNote(folderId, title, content, font) {
    const newNote = {
        id: generateId('note'),
        folderId: folderId,
        title: title || 'Untitled',
        content: content || '',
        font: font || 'garamond',
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    appData.notes.push(newNote);
    saveData();
    render();
}

function updateNote(noteId, title, content, font) {
    const note = appData.notes.find(n => n.id === noteId);
    if (note) {
        note.title = title || 'Untitled';
        note.content = content || '';
        note.font = font || 'garamond';
        note.updatedAt = Date.now();
        saveData();
        render();
    }
}

function moveNote(noteId, targetFolderId) {
    const note = appData.notes.find(n => n.id === noteId);
    if (note && targetFolderId !== note.folderId) {
        note.folderId = targetFolderId;
        note.updatedAt = Date.now();
        saveData();
        render();
    }
}

function deleteNote(noteId) {
    appData.notes = appData.notes.filter(n => n.id !== noteId);
    saveData();
    render();
}

function openNoteEditor(noteId = null, folderId = null) {
    currentEditingNoteId = noteId;
    currentNoteFolder = folderId;

    if (noteId) {
        const note = appData.notes.find(n => n.id === noteId);
        if (note) {
            elements.noteTitleInput.value = note.title;
            elements.noteContentEditor.innerHTML = note.content;
            setEditorFont(note.font || 'garamond');
        }
    } else {
        elements.noteTitleInput.value = '';
        elements.noteContentEditor.innerHTML = '';
        setEditorFont('garamond');
    }

    // Restore fullscreen preference (desktop only)
    const noteEditor = elements.noteModal.querySelector('.note-editor');
    const isFullscreen = localStorage.getItem('editorFullscreen') === 'true';
    if (isFullscreen && window.innerWidth > 480) {
        noteEditor.classList.add('fullscreen');
        elements.fullscreenToggle.classList.add('active');
    } else {
        noteEditor.classList.remove('fullscreen');
        elements.fullscreenToggle.classList.remove('active');
    }

    openModal(elements.noteModal);
    elements.noteTitleInput.focus();
}

function saveCurrentNote() {
    const title = elements.noteTitleInput.value.trim();
    const content = elements.noteContentEditor.innerHTML;

    if (currentEditingNoteId) {
        updateNote(currentEditingNoteId, title, content, currentEditorFont);
    } else if (currentNoteFolder) {
        createNote(currentNoteFolder, title, content, currentEditorFont);
    }

    closeAllModals();
    currentEditingNoteId = null;
    currentNoteFolder = null;
}

function openNotePreview(noteId) {
    const note = appData.notes.find(n => n.id === noteId);
    if (!note) return;

    currentEditingNoteId = noteId;
    elements.previewTitle.textContent = note.title || 'Untitled';
    elements.previewContent.innerHTML = note.content || '<em>(No content)</em>';
    // Apply font to preview
    elements.previewContent.className = 'preview-content';
    elements.previewContent.classList.add(`font-${note.font || 'garamond'}`);
    openModal(elements.previewModal);
}

function showNoteOptions(noteId) {
    const note = appData.notes.find(n => n.id === noteId);
    if (!note) return;

    elements.optionsTitle.textContent = `Note: ${note.title || 'Untitled'}`;
    elements.optionsContent.innerHTML = `
        <button class="modal-option" data-action="edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit Note
        </button>
        <button class="modal-option" data-action="move">
            <img src="${ICONS.folder}" alt="" class="option-icon">
            Move to Folder
        </button>
        <button class="modal-option" data-action="delete" style="color: var(--danger);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Delete Note
        </button>
    `;

    elements.optionsContent.querySelector('[data-action="edit"]').addEventListener('click', () => {
        closeAllModals();
        openNoteEditor(noteId);
    });

    elements.optionsContent.querySelector('[data-action="move"]').addEventListener('click', () => {
        closeAllModals();
        showMoveToFolder(noteId);
    });

    elements.optionsContent.querySelector('[data-action="delete"]').addEventListener('click', () => {
        closeAllModals();
        showDeleteConfirm(`Are you sure you want to delete this note?`, () => {
            deleteNote(noteId);
        });
    });

    openModal(elements.optionsModal);
}

function showMoveToFolder(noteId) {
    const note = appData.notes.find(n => n.id === noteId);
    if (!note) return;

    const allFolders = appData.folders.filter(f => f.id !== note.folderId);

    if (allFolders.length === 0) {
        alert('No other folders to move to. Create a new folder first.');
        return;
    }

    elements.moveTitle.textContent = 'Move to Folder';
    elements.moveOptions.innerHTML = allFolders.map(folder => {
        const tab = appData.tabs.find(t => t.id === folder.tabId);
        return `
            <button class="move-option" data-folder-id="${folder.id}">
                <img src="${ICONS.folder}" alt="" class="icon-img"> ${escapeHtml(folder.name)} <small style="color: var(--text-secondary);">(${tab ? tab.name : 'Unknown'})</small>
            </button>
        `;
    }).join('');

    elements.moveOptions.querySelectorAll('.move-option').forEach(btn => {
        btn.addEventListener('click', () => {
            moveNote(noteId, btn.dataset.folderId);
            closeAllModals();
        });
    });

    openModal(elements.moveModal);
}

// ============================================
// DIALOG HELPERS
// ============================================

let inputCallback = null;

function showInputDialog(title, defaultValue, callback) {
    elements.inputTitle.textContent = title;
    elements.inputField.value = defaultValue || '';
    inputCallback = callback;
    openModal(elements.inputModal);
    elements.inputField.focus();
    elements.inputField.select();
}

let deleteCallback = null;

function showDeleteConfirm(message, callback) {
    elements.deleteMessage.textContent = message;
    deleteCallback = callback;
    openModal(elements.deleteModal);
}

// ============================================
// EVENT LISTENERS
// ============================================

// Add button
elements.addBtn.addEventListener('click', () => {
    openModal(elements.addModal);
});

// Add modal options
elements.addModal.querySelectorAll('.modal-option').forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        closeAllModals();

        switch (action) {
            case 'new-tab':
                showInputDialog('New Tab Name', '', (name) => {
                    if (name.trim()) {
                        createTab(name.trim());
                    }
                });
                break;
            case 'new-folder':
                showInputDialog('New Folder Name', '', (name) => {
                    if (name.trim()) {
                        createFolder(name.trim());
                    }
                });
                break;
            case 'new-note':
                // Find first folder in current tab
                const folder = appData.folders.find(f => f.tabId === appData.activeTabId);
                if (folder) {
                    openNoteEditor(null, folder.id);
                } else {
                    alert('Please create a folder first');
                }
                break;
        }
    });
});

// FAB button - quick new note
elements.fabBtn.addEventListener('click', () => {
    const folder = appData.folders.find(f => f.tabId === appData.activeTabId);
    if (folder) {
        openNoteEditor(null, folder.id);
    } else {
        alert('Please create a folder first');
    }
});

// View mode buttons
elements.gridViewBtn.addEventListener('click', () => {
    appData.viewMode = 'grid';
    saveData();
    render();
});

elements.listViewBtn.addEventListener('click', () => {
    appData.viewMode = 'list';
    saveData();
    render();
});

// Note editor
elements.noteSaveBtn.addEventListener('click', saveCurrentNote);
elements.noteCancelBtn.addEventListener('click', () => {
    closeAllModals();
    currentEditingNoteId = null;
    currentNoteFolder = null;
});

// Fullscreen toggle for note editor (desktop only)
elements.fullscreenToggle.addEventListener('click', () => {
    const noteEditor = elements.noteModal.querySelector('.note-editor');
    noteEditor.classList.toggle('fullscreen');
    elements.fullscreenToggle.classList.toggle('active');
    // Save preference to localStorage
    localStorage.setItem('editorFullscreen', noteEditor.classList.contains('fullscreen'));
});

// Preview modal
elements.previewCloseBtn.addEventListener('click', () => {
    closeAllModals();
});
elements.previewEditBtn.addEventListener('click', () => {
    const noteId = currentEditingNoteId;
    closeAllModals();
    openNoteEditor(noteId);
});

// Input dialog
elements.inputSaveBtn.addEventListener('click', () => {
    if (inputCallback) {
        inputCallback(elements.inputField.value);
        inputCallback = null;
    }
    closeAllModals();
});
elements.inputCancelBtn.addEventListener('click', () => {
    inputCallback = null;
    closeAllModals();
});
elements.inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        elements.inputSaveBtn.click();
    }
});

// Delete confirmation
elements.deleteConfirmBtn.addEventListener('click', () => {
    if (deleteCallback) {
        deleteCallback();
        deleteCallback = null;
    }
    closeAllModals();
});
elements.deleteCancelBtn.addEventListener('click', () => {
    deleteCallback = null;
    closeAllModals();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllModals();
    }
});

// ============================================
// INITIALIZATION
// ============================================

// Initial render
render();

// Log app loaded
console.log('Campaign Notes app loaded');
