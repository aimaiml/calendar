// Global variables
let calendar;
let events = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadEvents();
    initializeModal();
});

// Load events from JSON file
async function loadEvents() {
    try {
        // Add timestamp to prevent caching issues
        const timestamp = new Date().getTime();
        const response = await fetch(`events.json?v=${timestamp}`);
        if (!response.ok) {
            throw new Error('Failed to load events');
        }
        events = await response.json();
        
        // Process events and add color coding
        events = events.map(event => {
            // Ensure multi-day events span correctly
            let processedEvent = {
                title: event.title,
                start: event.start,
                className: event.type || 'academic',
                backgroundColor: getEventColor(event.type),
                borderColor: getEventColor(event.type),
                textColor: '#ffffff',
                allDay: true,
                type: event.type,
                description: event.description
            };
            
            // For multi-day events, ensure end date includes the final day
            if (event.end && event.end !== event.start) {
                // For FullCalendar, end date should be the day AFTER the last intended day
                const endDate = new Date(event.end);
                endDate.setDate(endDate.getDate() + 1);
                processedEvent.end = endDate.toISOString().split('T')[0];
            } else if (event.end && event.end === event.start) {
                // Single day event
                processedEvent.end = event.end;
            }
            
            return processedEvent;
        });
        
        initializeCalendar();
    } catch (error) {
        console.error('Error loading events:', error);
        // Initialize calendar with empty events if loading fails
        events = [];
        initializeCalendar();
        showErrorMessage('Failed to load events. Please check your internet connection.');
    }
}

// Get color based on event type
function getEventColor(type) {
    switch (type) {
        case 'academic':
            return '#3b82f6';
        case 'co-curricular':
            return '#16a34a';
        default:
            return '#6b7280';
    }
}

// Initialize FullCalendar
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        height: 'auto',
        events: events,
        
        // Header toolbar configuration with custom view toggle
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'viewToggle' // Custom toggle button
        },
        
        // Custom buttons
        customButtons: {
            viewToggle: {
                text: 'Year',
                click: function() {
                    toggleView();
                }
            }
        },
        
        // Responsive behavior - Monthly view only
        aspectRatio: window.innerWidth < 768 ? 1.0 : 1.35,
        
        // Event handlers
        eventClick: function(info) {
            showEventDetails(info.event);
        },
        
        eventMouseEnter: function(info) {
            info.el.style.cursor = 'pointer';
            info.el.title = info.event.title + '\nClick for details';
        },
        
        // Custom rendering
        dayCellDidMount: function(info) {
            // Add custom styling for today
            if (info.isToday) {
                info.el.classList.add('fc-day-today');
            }
        },
        
        // Date click handler
        dateClick: function(info) {
            // Could be used to add events in admin mode
        },
        
        // View change handler to update button text
        viewDidMount: function(info) {
            const buttonText = info.view.type === 'dayGridMonth' ? 'Year' : 'Month';
            updateToggleButton(buttonText);
        },
        
        // Loading state
        loading: function(bool) {
            if (bool) {
                showLoadingState();
            } else {
                hideLoadingState();
            }
        },
        
        // Add event render callback for debugging
        eventDidMount: function(info) {
            // Event rendering complete
        },
        
        // Responsive breakpoints with custom toggle button
        windowResize: function() {
            updateHeaderToolbar();
        }
    });
    
    calendar.render();
    
    // Apply mobile-specific settings if needed
    if (window.innerWidth < 768) {
        applyMobileSettings();
    }
}

// Apply mobile-specific calendar settings
function applyMobileSettings() {
    if (calendar) {
        calendar.setOption('aspectRatio', 1.0);
        updateHeaderToolbar();
    }
}

// Toggle between month and year view
function toggleView() {
    if (calendar) {
        const currentView = calendar.view.type;
        if (currentView === 'dayGridMonth') {
            calendar.changeView('dayGridYear');
            updateToggleButton('Month');
        } else {
            calendar.changeView('dayGridMonth');
            updateToggleButton('Year');
        }
    }
}

// Update the toggle button text
function updateToggleButton(text) {
    if (calendar) {
        calendar.setOption('customButtons', {
            viewToggle: {
                text: text,
                click: function() {
                    toggleView();
                }
            }
        });
    }
}

// Update header toolbar based on screen size and current view
function updateHeaderToolbar() {
    if (calendar) {
        const currentView = calendar.view.type;
        const buttonText = currentView === 'dayGridMonth' ? 'Year' : 'Month';
        
        if (window.innerWidth < 768) {
            calendar.setOption('aspectRatio', 1.0);
            calendar.setOption('headerToolbar', {
                left: 'prev,next',
                center: 'title',
                right: 'today,viewToggle'
            });
        } else {
            calendar.setOption('aspectRatio', 1.35);
            calendar.setOption('headerToolbar', {
                left: 'prev,next today',
                center: 'title',
                right: 'viewToggle'
            });
        }
        
        updateToggleButton(buttonText);
    }
}

// Show event details in modal
function showEventDetails(event) {
    const modal = document.getElementById('eventModal');
    const title = document.getElementById('modalTitle');
    const type = document.getElementById('modalType');
    const date = document.getElementById('modalDate');
    const description = document.getElementById('modalDescription');
    
    // Set modal content
    title.textContent = event.title;
    type.textContent = event.extendedProps.type || 'academic';
    type.className = `event-type-badge ${event.extendedProps.type || 'academic'}`;
    
    // Format date
    const startDate = new Date(event.start);
    const endDate = event.end ? new Date(event.end) : null;
    
    if (endDate && endDate.getTime() !== startDate.getTime()) {
        date.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    } else {
        date.textContent = formatDate(startDate);
    }
    
    description.textContent = event.extendedProps.description || 'No description available.';
    
    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Add accessibility
    modal.setAttribute('aria-hidden', 'false');
    title.focus();
}

// Initialize modal functionality
function initializeModal() {
    const modal = document.getElementById('eventModal');
    const closeBtn = document.querySelector('.close');
    
    // Close modal when clicking close button
    closeBtn.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });
}

// Close modal
function closeModal() {
    const modal = document.getElementById('eventModal');
    modal.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
    modal.setAttribute('aria-hidden', 'true');
}

// Format date for display
function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    return date.toLocaleDateString('en-US', options);
}

// Show loading state
function showLoadingState() {
    const calendarEl = document.getElementById('calendar');
    if (!document.querySelector('.loading-overlay')) {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading calendar...</p>
            </div>
        `;
        calendarEl.appendChild(loadingOverlay);
    }
}

// Hide loading state
function hideLoadingState() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

// Show error message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-content">
            <h3>⚠️ Error</h3>
            <p>${message}</p>
            <button onclick="location.reload()" class="btn btn-primary">Retry</button>
        </div>
    `;
    
    const container = document.querySelector('.calendar-container');
    container.insertBefore(errorDiv, container.firstChild);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 10000);
}

// Utility function to refresh calendar (useful for admin updates)
function refreshCalendar() {
    if (calendar) {
        loadEvents();
    }
}

// Export functions for potential use in admin panel
window.calendarAPI = {
    refreshCalendar,
    getEvents: () => events,
    addEvent: (event) => {
        events.push(event);
        if (calendar) {
            calendar.addEvent(event);
        }
    }
};

// Handle window resize for mobile optimization
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (calendar) {
            calendar.render();
        }
    }, 250);
});

// Add CSS for loading and error states
const dynamicStyles = `
    .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        border-radius: 12px;
    }
    
    .loading-spinner {
        text-align: center;
    }
    
    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e5e7eb;
        border-top: 4px solid #6366f1;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .error-message {
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        text-align: center;
    }
    
    .error-content h3 {
        color: #dc2626;
        margin-bottom: 0.5rem;
    }
    
    .error-content p {
        color: #991b1b;
        margin-bottom: 1rem;
    }
    
    .mobile-view-toggle {
        margin-top: 0.5rem;
    }
    
    .mobile-view-select {
        padding: 0.5rem;
        border: 2px solid #6366f1;
        border-radius: 6px;
        background: white;
        color: #6366f1;
        font-weight: 500;
        width: 100%;
        max-width: 150px;
    }
    
    @media (max-width: 768px) {
        .fc-toolbar {
            position: relative;
        }
        
        .mobile-view-toggle {
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 0.5rem;
        }
    }
`;

// Inject dynamic styles
const styleSheet = document.createElement('style');
styleSheet.textContent = dynamicStyles;
document.head.appendChild(styleSheet);