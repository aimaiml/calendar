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
        const response = await fetch('events.json');
        if (!response.ok) {
            throw new Error('Failed to load events');
        }
        events = await response.json();
        
        // Process events and add color coding
        events = events.map(event => {
            // Ensure multi-day events span correctly
            let processedEvent = {
                ...event,
                className: event.type || 'academic',
                backgroundColor: getEventColor(event.type),
                borderColor: getEventColor(event.type),
                textColor: '#ffffff'
            };
            
            // For multi-day events, ensure end date is inclusive
            if (event.end && event.end !== event.start) {
                // Add one day to end date to make it inclusive for FullCalendar
                const endDate = new Date(event.end);
                endDate.setDate(endDate.getDate() + 1);
                processedEvent.end = endDate.toISOString().split('T')[0];
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
        
        // Header toolbar configuration
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        
        // Responsive behavior
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
            console.log('Date clicked:', info.dateStr);
        },
        
        // Loading state
        loading: function(bool) {
            if (bool) {
                showLoadingState();
            } else {
                hideLoadingState();
            }
        },
        
        // Responsive breakpoints
        windowResize: function() {
            if (window.innerWidth < 768) {
                calendar.setOption('aspectRatio', 1.0);
                calendar.setOption('headerToolbar', {
                    left: 'prev,next',
                    center: 'title',
                    right: 'today'
                });
            } else {
                calendar.setOption('aspectRatio', 1.35);
                calendar.setOption('headerToolbar', {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                });
            }
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
        calendar.setOption('headerToolbar', {
            left: 'prev,next',
            center: 'title',
            right: 'today'
        });
        
        // Add view toggle for mobile
        setTimeout(() => {
            addMobileViewToggle();
        }, 100);
    }
}

// Add mobile view toggle
function addMobileViewToggle() {
    const toolbar = document.querySelector('.fc-toolbar');
    if (toolbar && window.innerWidth < 768) {
        const viewToggle = document.createElement('div');
        viewToggle.className = 'mobile-view-toggle';
        viewToggle.innerHTML = `
            <select id="mobileViewSelect" class="mobile-view-select">
                <option value="dayGridMonth">Month</option>
                <option value="timeGridWeek">Week</option>
                <option value="timeGridDay">Day</option>
            </select>
        `;
        
        toolbar.appendChild(viewToggle);
        
        document.getElementById('mobileViewSelect').addEventListener('change', function(e) {
            calendar.changeView(e.target.value);
        });
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