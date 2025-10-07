// Global variables for admin panel
let adminCalendar;
let adminEvents = [];
let currentEditingEvent = null;

// Default admin password (change this in production)
const ADMIN_PASSWORD = 'admin123';

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('eventStart').value = today;
    
    // Focus on password field
    document.getElementById('adminPassword').focus();
    
    // Add enter key listener for password
    document.getElementById('adminPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkPassword();
        }
    });
    
    // Initialize form handlers
    initializeEventForm();
    initializeModal();
});

// Check admin password
function checkPassword() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === ADMIN_PASSWORD) {
        document.getElementById('passwordScreen').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        loadAdminEvents();
        showSuccessMessage('✅ Access granted! Welcome to the admin panel.');
    } else {
        showErrorMessage('❌ Incorrect password. Please try again.');
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').focus();
    }
}

// Load events for admin panel
async function loadAdminEvents() {
    try {
        // Add timestamp to prevent caching issues
        const timestamp = new Date().getTime();
        const response = await fetch(`events.json?v=${timestamp}`);
        if (!response.ok) {
            throw new Error('Failed to load events');
        }
        adminEvents = await response.json();
        
        // Process events for calendar display
        const processedEvents = adminEvents.map(event => {
            let processedEvent = {
                ...event,
                className: event.type || 'academic',
                backgroundColor: getEventColor(event.type),
                borderColor: getEventColor(event.type),
                textColor: '#ffffff',
                id: generateEventId(event) // Generate unique ID for editing
            };
            
            // For multi-day events, ensure end date includes the final day
            if (event.end && event.end !== event.start) {
                // FullCalendar expects end date to be the day AFTER the last day
                const endDate = new Date(event.end + 'T00:00:00');
                endDate.setDate(endDate.getDate() + 1);
                processedEvent.end = endDate.toISOString().split('T')[0];
            }
            
            return processedEvent;
        });
        
        initializeAdminCalendar(processedEvents);
        updateEventsList();
        
    } catch (error) {
        console.error('Error loading events:', error);
        adminEvents = [];
        initializeAdminCalendar([]);
        showErrorMessage('Failed to load existing events. Starting with empty calendar.');
    }
}

// Generate unique ID for events
function generateEventId(event) {
    return btoa(event.title + event.start + event.type).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
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

// Initialize admin calendar
function initializeAdminCalendar(events) {
    const calendarEl = document.getElementById('adminCalendar');
    
    adminCalendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        height: 'auto',
        events: events,
        
        // Header toolbar - Monthly view only
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: '' // Remove week/day views
        },
        
        aspectRatio: window.innerWidth < 768 ? 1.0 : 1.35,
        
        eventClick: function(info) {
            showEventDetailsModal(info.event);
        },
        
        eventMouseEnter: function(info) {
            info.el.style.cursor = 'pointer';
            info.el.title = info.event.title + '\nClick to edit/delete';
        },
        
        dateClick: function(info) {
            // Pre-fill form with clicked date
            document.getElementById('eventStart').value = info.dateStr;
            document.getElementById('eventTitle').focus();
            
            // Scroll to form
            document.getElementById('eventForm').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
    
    adminCalendar.render();
}

// Initialize event form
function initializeEventForm() {
    const form = document.getElementById('eventForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        addEvent();
    });
    
    // Auto-set end date when start date changes
    document.getElementById('eventStart').addEventListener('change', function() {
        const startDate = this.value;
        const endDateField = document.getElementById('eventEnd');
        
        if (!endDateField.value) {
            endDateField.value = startDate;
        }
    });
}

// Add new event
function addEvent() {
    const title = document.getElementById('eventTitle').value.trim();
    const start = document.getElementById('eventStart').value;
    const end = document.getElementById('eventEnd').value || start;
    const type = document.getElementById('eventType').value;
    const description = document.getElementById('eventDescription').value.trim();
    
    // Validation
    if (!title || !start || !type) {
        showErrorMessage('Please fill in all required fields (Title, Start Date, Type)');
        return;
    }
    
    // Validate dates
    if (end < start) {
        showErrorMessage('End date cannot be before start date');
        return;
    }
    
    // Create new event object
    const newEvent = {
        title: title,
        start: start,
        end: end,
        type: type,
        description: description || `${type === 'academic' ? 'Academic' : 'Co-curricular'} event scheduled for ${formatDate(new Date(start))}.`
    };
    
    // Add to events array
    adminEvents.push(newEvent);
    
    // Add to calendar
    const calendarEvent = {
        ...newEvent,
        className: type,
        backgroundColor: getEventColor(type),
        borderColor: getEventColor(type),
        textColor: '#ffffff',
        id: generateEventId(newEvent)
    };
    
    // For multi-day events, ensure end date includes the final day for FullCalendar display
    if (end && end !== start) {
        const endDate = new Date(end + 'T00:00:00');
        endDate.setDate(endDate.getDate() + 1);
        calendarEvent.end = endDate.toISOString().split('T')[0];
    }
    
    adminCalendar.addEvent(calendarEvent);
    
    // Update events list
    updateEventsList();
    
    // Clear form
    clearForm();
    
    showSuccessMessage(`✅ Event "${title}" added successfully!`);
}

// Clear form
function clearForm() {
    document.getElementById('eventForm').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('eventStart').value = today;
    currentEditingEvent = null;
    
    // Update form button text
    const submitBtn = document.querySelector('#eventForm button[type="submit"]');
    submitBtn.textContent = 'Add Event';
    submitBtn.className = 'btn btn-primary';
}

// Update events list display
function updateEventsList() {
    const listContainer = document.getElementById('eventsList');
    
    if (adminEvents.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <p>📅 No events added yet. Use the form above to add your first event.</p>
            </div>
        `;
        return;
    }
    
    // Sort events by start date
    const sortedEvents = [...adminEvents].sort((a, b) => new Date(a.start) - new Date(b.start));
    
    listContainer.innerHTML = sortedEvents.map((event, index) => `
        <div class="event-item ${event.type}" data-index="${index}">
            <div class="event-header">
                <h4 class="event-title">${event.title}</h4>
                <span class="event-type-badge ${event.type}">${event.type}</span>
            </div>
            <div class="event-details">
                <p class="event-date">📅 ${formatEventDate(event)}</p>
                <p class="event-description">${event.description || 'No description'}</p>
            </div>
            <div class="event-actions">
                <button onclick="editEventFromList(${adminEvents.indexOf(event)})" class="btn btn-small btn-primary">✏️ Edit</button>
                <button onclick="deleteEventFromList(${adminEvents.indexOf(event)})" class="btn btn-small btn-secondary">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

// Format event date for display
function formatEventDate(event) {
    const start = new Date(event.start);
    const end = event.end ? new Date(event.end) : null;
    
    if (end && end.getTime() !== start.getTime()) {
        return `${formatDate(start)} - ${formatDate(end)}`;
    } else {
        return formatDate(start);
    }
}

// Format date
function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Edit event from list
function editEventFromList(index) {
    const event = adminEvents[index];
    if (!event) return;
    
    // Populate form with event data
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventStart').value = event.start;
    document.getElementById('eventEnd').value = event.end || event.start;
    document.getElementById('eventType').value = event.type;
    document.getElementById('eventDescription').value = event.description || '';
    
    // Set editing mode
    currentEditingEvent = index;
    
    // Update form button
    const submitBtn = document.querySelector('#eventForm button[type="submit"]');
    submitBtn.textContent = 'Update Event';
    submitBtn.className = 'btn btn-success';
    
    // Scroll to form
    document.getElementById('eventForm').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
    
    showInfoMessage('📝 Event loaded for editing. Make your changes and click "Update Event".');
}

// Delete event from list
function deleteEventFromList(index) {
    const event = adminEvents[index];
    if (!event) return;
    
    if (confirm(`Are you sure you want to delete the event "${event.title}"?`)) {
        // Remove from array
        adminEvents.splice(index, 1);
        
        // Remove from calendar
        const calendarEvent = adminCalendar.getEventById(generateEventId(event));
        if (calendarEvent) {
            calendarEvent.remove();
        }
        
        // Update display
        updateEventsList();
        
        showSuccessMessage(`✅ Event "${event.title}" deleted successfully!`);
    }
}

// Show event details modal
function showEventDetailsModal(event) {
    const modal = document.getElementById('eventModal');
    const title = document.getElementById('modalTitle');
    const type = document.getElementById('modalType');
    const date = document.getElementById('modalDate');
    const description = document.getElementById('modalDescription');
    
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
    
    // Store current event for editing
    currentEditingEvent = adminEvents.findIndex(e => 
        e.title === event.title && 
        e.start === event.startStr && 
        e.type === event.extendedProps.type
    );
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Initialize modal
function initializeModal() {
    const modal = document.getElementById('eventModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
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
    document.body.style.overflow = '';
}

// Edit event from modal
function editEvent() {
    if (currentEditingEvent !== null && currentEditingEvent >= 0) {
        editEventFromList(currentEditingEvent);
        closeModal();
    }
}

// Delete event from modal
function deleteEvent() {
    if (currentEditingEvent !== null && currentEditingEvent >= 0) {
        closeModal();
        setTimeout(() => {
            deleteEventFromList(currentEditingEvent);
        }, 100);
    }
}

// Refresh events list
function refreshEventsList() {
    loadAdminEvents();
    showInfoMessage('🔄 Events list refreshed!');
}

// Generate JSON
function generateJSON() {
    const jsonOutput = JSON.stringify(adminEvents, null, 2);
    document.getElementById('jsonOutput').textContent = jsonOutput;
    document.getElementById('jsonContainer').style.display = 'block';
    
    // Scroll to JSON output
    document.getElementById('jsonContainer').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

// Copy JSON to clipboard
async function copyJSON() {
    const jsonOutput = document.getElementById('jsonOutput').textContent;
    
    try {
        await navigator.clipboard.writeText(jsonOutput);
        showSuccessMessage('📋 JSON copied to clipboard!');
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = jsonOutput;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSuccessMessage('📋 JSON copied to clipboard!');
    }
}

// Download JSON file
function downloadJSON() {
    const jsonOutput = JSON.stringify(adminEvents, null, 2);
    const blob = new Blob([jsonOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'events.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccessMessage('💾 JSON file downloaded!');
}

// Hide JSON output
function hideJSON() {
    document.getElementById('jsonContainer').style.display = 'none';
}

// Message functions
function showSuccessMessage(message) {
    showMessage(message, 'success');
}

function showErrorMessage(message) {
    showMessage(message, 'error');
}

function showInfoMessage(message) {
    showMessage(message, 'info');
}

function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.admin-message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `admin-message admin-message-${type}`;
    messageDiv.innerHTML = `
        <div class="message-content">
            <span class="message-text">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="message-close">×</button>
        </div>
    `;
    
    // Insert at top of admin content
    const adminContent = document.getElementById('adminContent');
    if (adminContent.style.display !== 'none') {
        adminContent.insertBefore(messageDiv, adminContent.firstChild);
    } else {
        // If admin content is hidden, show in password screen
        const passwordScreen = document.getElementById('passwordScreen');
        passwordScreen.appendChild(messageDiv);
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// Handle form submission for editing
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('eventForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (currentEditingEvent !== null && currentEditingEvent >= 0) {
                updateEvent();
            } else {
                addEvent();
            }
        });
    }
});

// Update existing event
function updateEvent() {
    const title = document.getElementById('eventTitle').value.trim();
    const start = document.getElementById('eventStart').value;
    const end = document.getElementById('eventEnd').value || start;
    const type = document.getElementById('eventType').value;
    const description = document.getElementById('eventDescription').value.trim();
    
    // Validation
    if (!title || !start || !type) {
        showErrorMessage('Please fill in all required fields (Title, Start Date, Type)');
        return;
    }
    
    if (end < start) {
        showErrorMessage('End date cannot be before start date');
        return;
    }
    
    // Update event in array
    const oldEvent = adminEvents[currentEditingEvent];
    adminEvents[currentEditingEvent] = {
        title: title,
        start: start,
        end: end,
        type: type,
        description: description || `${type === 'academic' ? 'Academic' : 'Co-curricular'} event scheduled for ${formatDate(new Date(start))}.`
    };
    
    // Remove old event from calendar
    const oldCalendarEvent = adminCalendar.getEventById(generateEventId(oldEvent));
    if (oldCalendarEvent) {
        oldCalendarEvent.remove();
    }
    
    // Add updated event to calendar
    const updatedEvent = {
        ...adminEvents[currentEditingEvent],
        className: type,
        backgroundColor: getEventColor(type),
        borderColor: getEventColor(type),
        textColor: '#ffffff',
        id: generateEventId(adminEvents[currentEditingEvent])
    };
    
    // For multi-day events, ensure end date includes the final day for FullCalendar display
    if (end && end !== start) {
        const endDate = new Date(end + 'T00:00:00');
        endDate.setDate(endDate.getDate() + 1);
        updatedEvent.end = endDate.toISOString().split('T')[0];
    }
    
    adminCalendar.addEvent(updatedEvent);
    
    // Update events list
    updateEventsList();
    
    // Clear form
    clearForm();
    
    showSuccessMessage(`✅ Event "${title}" updated successfully!`);
}

// Add additional CSS for admin-specific styling
const adminStyles = `
    .btn-small {
        padding: 0.4rem 0.8rem;
        font-size: 0.8rem;
        min-width: auto;
    }
    
    .event-item {
        background: white;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        border-left: 4px solid #e5e7eb;
    }
    
    .event-item.academic {
        border-left-color: #3b82f6;
    }
    
    .event-item.co-curricular {
        border-left-color: #16a34a;
    }
    
    .event-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.5rem;
        gap: 1rem;
    }
    
    .event-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
        flex: 1;
    }
    
    .event-details {
        margin-bottom: 1rem;
    }
    
    .event-date {
        color: #6b7280;
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
    }
    
    .event-description {
        color: #4b5563;
        font-size: 0.9rem;
        line-height: 1.5;
        margin: 0;
    }
    
    .event-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    
    .empty-state {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
        font-style: italic;
    }
    
    .admin-message {
        margin-bottom: 1rem;
        border-radius: 8px;
        padding: 1rem;
        animation: slideInFromTop 0.3s ease-out;
    }
    
    .admin-message-success {
        background-color: #f0fdf4;
        border: 1px solid #bbf7d0;
        color: #166534;
    }
    
    .admin-message-error {
        background-color: #fef2f2;
        border: 1px solid #fecaca;
        color: #dc2626;
    }
    
    .admin-message-info {
        background-color: #eff6ff;
        border: 1px solid #bfdbfe;
        color: #1d4ed8;
    }
    
    .message-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }
    
    .message-close {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: inherit;
        opacity: 0.7;
        padding: 0;
        width: 1.5rem;
        height: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
    }
    
    .message-close:hover {
        opacity: 1;
        background-color: rgba(0, 0, 0, 0.1);
    }
    
    @keyframes slideInFromTop {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .modal-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        margin-top: 1rem;
    }
    
    @media (max-width: 768px) {
        .event-header {
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .event-actions {
            justify-content: center;
        }
        
        .message-content {
            flex-direction: column;
            gap: 0.5rem;
            text-align: center;
        }
    }
`;

// Inject admin-specific styles
const adminStyleSheet = document.createElement('style');
adminStyleSheet.textContent = adminStyles;
document.head.appendChild(adminStyleSheet);