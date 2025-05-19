// Main JavaScript for Safelyne Emergency Response System

// Toast notification function
function showToast(message, icon = 'info-circle', duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const iconElement = toast.querySelector('i');
    
    // Update icon
    iconElement.className = `fas fa-${icon}`;
    
    // Update message
    toastMessage.textContent = message;
    
    // Show toast
    toast.classList.add('show');
    
    // Hide after duration
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Format current time
function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

// Add message to chat
function addMessage(text, type, sender = null) {
    const chatMessages = document.getElementById('chatMessages');
    const message = document.createElement('div');
    message.className = `message message-${type}`;
    
    let messageContent = '';
    
    if (type === 'system') {
        messageContent = `<div>${text}</div>`;
    } else {
        const timeString = getCurrentTime();
        
        if (sender && type === 'received') {
            messageContent = `
                <div class="message-sender">${sender}</div>
                <div>${text}</div>
                <div class="message-time">${timeString}</div>
            `;
        } else if (type === 'sent') {
            messageContent = `
                <div>${text}</div>
                <div class="message-time">${timeString}</div>
                <div class="message-status">
                    <span>Delivered</span>
                    <i class="fas fa-check-double"></i>
                </div>
            `;
        } else {
            messageContent = `
                <div>${text}</div>
                <div class="message-time">${timeString}</div>
            `;
        }
    }
    
    message.innerHTML = messageContent;
    chatMessages.appendChild(message);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return message;
}

// Function to update ETA
function updateETA(minutes, location = null) {
    const etaValue = document.getElementById('etaValue');
    etaValue.textContent = `${minutes} minute${minutes === 1 ? '' : 's'}`;
    
    if (location) {
        document.querySelector('.eta-location').textContent = `to ${location}`;
    }
}

// Update timeline status
function updateTimelineStatus(step) {
    const timelineDots = document.querySelectorAll('.timeline-dot');
    
    for (let i = 0; i < timelineDots.length; i++) {
        if (i < step) {
            timelineDots[i].classList.add('active');
            timelineDots[i].classList.remove('pending');
        } else {
            timelineDots[i].classList.remove('active');
            timelineDots[i].classList.add('pending');
        }
    }
}

// Send message function
function sendMessage() {
    const input = document.querySelector('.chat-input');
    const text = input.value.trim();
    
    if (text) {
        // Add user message
        addMessage(text, 'sent');
        input.value = '';
        
        // Simulate response after a short delay
        setTimeout(() => {
            // Show typing indicator
            const typingIndicator = addMessage('Typing...', 'received', 'Safelyne Emergency Response');
            
            // Remove typing indicator after a delay and show actual response
            setTimeout(() => {
                chatMessages.removeChild(typingIndicator);
                
                // Generate contextual response
                let responseText;
                if (text.toLowerCase().includes('person') || text.toLowerCase().includes('following')) {
                    responseText = "Thank you for the description. This information has been relayed to the responding officers. Please stay inside the coffee shop where it's safe until officers arrive. They're less than 2 minutes away now.";
                    updateETA(2);
                } else if (text.toLowerCase().includes('safe') || text.toLowerCase().includes('ok')) {
                    responseText = "I'm glad to hear that. Please continue to stay where you are until officers arrive to ensure your safety. They'll need to take a brief statement about the incident.";
                } else {
                    responseText = "I've relayed your message to the responding officers. They're approaching your location now and should arrive in approximately 2 minutes. Is there anything else we should know about your current situation?";
                    updateETA(2);
                }
                
                addMessage(responseText, 'received', 'Safelyne Emergency Response');
            }, 1500);
        }, 1000);
    }
}

// Function to simulate incoming calls
function simulateIncomingCall(callerName = "Officer Johnson") {
    // Create call overlay
    const callOverlay = document.createElement('div');
    callOverlay.className = 'call-overlay';
    callOverlay.innerHTML = `
        <div class="call-container">
            <div class="call-header">
                <div class="caller-icon">
                    <i class="fas fa-user-shield"></i>
                </div>
                <div class="caller-info">
                    <div class="caller-name">${callerName}</div>
                    <div class="caller-status">Incoming emergency call...</div>
                </div>
            </div>
            <div class="call-timer">00:00</div>
            <div class="call-actions">
                <button class="call-action call-accept">
                    <i class="fas fa-phone"></i>
                    Accept
                </button>
                <button class="call-action call-decline">
                    <i class="fas fa-phone-slash"></i>
                    Decline
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(callOverlay);
    
    // Play ringtone
    const ringtone = new Audio('https://assets.sounddodge.com/ringtones/iphone_ringtone.mp3');
    ringtone.loop = true;
    ringtone.play().catch(e => console.log("Audio play prevented by browser policy", e));
    
    // Add event listeners to call buttons
    callOverlay.querySelector('.call-accept').addEventListener('click', function() {
        ringtone.pause();
        callOverlay.querySelector('.caller-status').textContent = 'Connected';
        startCallTimer(callOverlay.querySelector('.call-timer'));
        
        // Change buttons to show only end call
        const callActions = callOverlay.querySelector('.call-actions');
        callActions.innerHTML = `
            <button class="call-action call-end">
                <i class="fas fa-phone-slash"></i>
                End Call
            </button>
        `;
        
        // Add event listener to end call button
        callActions.querySelector('.call-end').addEventListener('click', function() {
            endCall(callOverlay);
            addMessage("Call ended. Officers are still on their way to your location.", 'system');
        });
        
        // Show toast notification
        showToast('Call connected with emergency responder', 'phone-alt');
        
        // Add message to chat
        addMessage("You accepted a call with Officer Johnson", 'system');
    });
    
    callOverlay.querySelector('.call-decline').addEventListener('click', function() {
        ringtone.pause();
        endCall(callOverlay);
        
        // Add message to chat
        addMessage("You declined the call. Would you prefer to continue communicating via text?", 'received', 'Safelyne Emergency Response');
    });
    
    return callOverlay;
}

// Function to start call timer
function startCallTimer(timerElement) {
    let seconds = 0;
    const timerInterval = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }, 1000);
    
    // Store interval ID in the element's dataset
    timerElement.dataset.intervalId = timerInterval;
}

// Function to end call
function endCall(callOverlay) {
    // Clear timer interval if it exists
    const timerElement = callOverlay.querySelector('.call-timer');
    if (timerElement && timerElement.dataset.intervalId) {
        clearInterval(timerElement.dataset.intervalId);
    }
    
    // Add ending animation
    callOverlay.classList.add('call-ending');
    
    // Remove overlay after animation
    setTimeout(() => {
        document.body.removeChild(callOverlay);
    }, 500);
}

// Function to update emergency status
function updateEmergencyStatus(status) {
    const statusIndicator = document.querySelector('.status-indicator span');
    const statusDot = document.querySelector('.status-dot');
    
    statusIndicator.textContent = status;
    
    if (status === 'Emergency Resolved') {
        statusDot.style.backgroundColor = '#00ff00';
        statusDot.style.animationName = 'pulse-green';
        
        // Update timeline
        updateTimelineStatus(5);
        
        // Add system message
        addMessage("Emergency has been marked as resolved. A follow-up report will be sent to your email.", 'system');
    } else if (status === 'On Scene') {
        statusDot.style.backgroundColor = '#ffaa00';
        statusDot.style.animationName = 'pulse-yellow';
        
        // Update timeline
        updateTimelineStatus(4);
    }
}

// Function to simulate live location updates
function simulateLocationUpdates() {
    const locations = [
        { name: "Morning Brew, Pine St & 5th Ave", time: 0 },
        { name: "Morning Brew, Pine St & 5th Ave (Officers approaching)", time: 5000 },
        { name: "Morning Brew, Pine St (Officers on scene)", time: 10000 }
    ];
    
    locations.forEach(location => {
        setTimeout(() => {
            // Update location in ETA container
            const etaLocation = document.querySelector('.eta-location');
            if (etaLocation) {
                etaLocation.textContent = `to ${location.name}`;
            }
            
            // If officers on scene, update status
            if (location.name.includes("on scene")) {
                updateEmergencyStatus('On Scene');
                updateETA('0');
                addMessage("Officers have arrived at Morning Brew. They are now looking for you inside.", 'system');
            }
        }, location.time);
    });
}

// Function to handle emergency resolution
function resolveEmergency() {
    // Update status
    updateEmergencyStatus('Emergency Resolved');
    
    // Create resolution summary
    const summary = document.createElement('div');
    summary.className = 'resolution-summary';
    summary.innerHTML = `
        <div class="resolution-header">
            <i class="fas fa-check-circle"></i>
            <h3>Emergency Resolved</h3>
        </div>
        <div class="resolution-details">
            <div class="resolution-item">
                <span class="resolution-label">Response Time:</span>
                <span class="resolution-value">8 minutes</span>
            </div>
            <div class="resolution-item">
                <span class="resolution-label">Case Number:</span>
                <span class="resolution-value">PD-2505-437</span>
            </div>
            <div class="resolution-item">
                <span class="resolution-label">Follow-up:</span>
                <span class="resolution-value">Report will be emailed</span>
            </div>
        </div>
        <div class="resolution-actions">
            <button class="resolution-button" id="feedbackButton">
                <i class="fas fa-star"></i>
                Provide Feedback
            </button>
            <button class="resolution-button" id="resourcesButton">
                <i class="fas fa-file-alt"></i>
                Support Resources
            </button>
        </div>
    `;
    
    chatMessages.appendChild(summary);
    
    // Add event listeners to resolution buttons
    summary.querySelector('#feedbackButton').addEventListener('click', function() {
        showToast('Feedback form will open in a new window', 'star');
        window.open('feedback.html', '_blank');
    });
    
    summary.querySelector('#resourcesButton').addEventListener('click', function() {
        showToast('Support resources loaded', 'heart');
        addMessage("Here are some support resources that might be helpful after your experience:\n\n• Local Crisis Counseling: (555) 123-4567\n• Community Safety Program: www.safelyne.com/resources\n• Victim Advocacy Services: (555) 987-6543\n\nWould you like me to email these resources to you?", 'received', 'Safelyne Emergency Response');
    });
}

// Function to add CSS for new components
function addAdditionalStyles() {
    const stylesheet = document.createElement('style');
    stylesheet.textContent = `
        /* Call Overlay Styles */
        .call-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        }
        
        .call-container {
            width: 90%;
            max-width: 350px;
            background-color: #1b1b32;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .call-ending {
            animation: fadeOut 0.5s ease forwards;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        .call-header {
            display: flex;
            align-items: center;
            width: 100%;
            margin-bottom: 20px;
        }
        
        .caller-icon {
            width: 60px;
            height: 60px;
            background-color: #5d5df7;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            margin-right: 15px;
        }
        
        .caller-info {
            flex: 1;
        }
        
        .caller-name {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .caller-status {
            font-size: 14px;
            color: #cccccc;
        }
        
        .call-timer {
            font-size: 24px;
            font-weight: bold;
            margin: 15px 0;
        }
        
        .call-actions {
            display: flex;
            gap: 20px;
            margin-top: 20px;
        }
        
        .call-action {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: none;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .call-accept {
            background-color: #00c853;
            color: white;
        }
        
        .call-decline, .call-end {
            background-color: #ff3d00;
            color: white;
        }
        
        .call-action i {
            font-size: 24px;
            margin-bottom: 5px;
        }
        
        .call-action:hover {
            transform: scale(1.05);
        }
        
        /* Resolution Summary Styles */
        .resolution-summary {
            background-color: rgba(0, 200, 83, 0.1);
            border: 1px solid rgba(0, 200, 83, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            align-self: center;
            width: 90%;
        }
        
        .resolution-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
            color: #00c853;
        }
        
        .resolution-header i {
            font-size: 24px;
        }
        
        .resolution-header h3 {
            margin: 0;
            font-size: 18px;
        }
        
        .resolution-details {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .resolution-item {
            display: flex;
            justify-content: space-between;
        }
        
        .resolution-label {
            color: #cccccc;
        }
        
        .resolution-value {
            font-weight: bold;
        }
        
        .resolution-actions {
            display: flex;
            gap: 10px;
            justify-content: space-between;
        }
        
        .resolution-button {
            flex: 1;
            background-color: rgba(93, 93, 247, 0.2);
            border: 1px solid rgba(93, 93, 247, 0.5);
            border-radius: 8px;
            padding: 10px;
            color: white;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .resolution-button:hover {
            background-color: rgba(93, 93, 247, 0.3);
            transform: translateY(-2px);
        }
        
        @keyframes pulse-green {
            0% {
                box-shadow: 0 0 0 0 rgba(0, 200, 83, 0.7);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(0, 200, 83, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(0, 200, 83, 0);
            }
        }
        
        @keyframes pulse-yellow {
            0% {
                box-shadow: 0 0 0 0 rgba(255, 170, 0, 0.7);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(255, 170, 0, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(255, 170, 0, 0);
            }
        }
    `;
    
    document.head.appendChild(stylesheet);
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add additional styles
    addAdditionalStyles();
    
    // Send button click handler
    document.querySelector('.send-button').addEventListener('click', function() {
        sendMessage();
    });

    // Enter key press handler
    document.querySelector('.chat-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Quick response handlers
    document.getElementById('helpResponse').addEventListener('click', function() {
        const text = "I need immediate help now!";
        addMessage(text, 'sent');
        showToast('Emergency alert sent to responders', 'exclamation-triangle');
        
        setTimeout(() => {
            addMessage("PRIORITY ESCALATED. All available units have been alerted. ETA is now 1 minute. Stay on this chat and remain where you are if it's safe to do so.", 'received', 'Safelyne Emergency Response');
            updateETA(1);
        }, 1000);
    });

    document.getElementById('safeResponse').addEventListener('click', function() {
        const text = "I'm safe now. The situation has improved.";
        addMessage(text, 'sent');
        showToast('Status update sent', 'check-circle');
        
        setTimeout(() => {
            addMessage("Thank you for the update. Officers will still arrive at your location to ensure your safety and take a statement. Would you like to downgrade the emergency level?", 'received', 'Safelyne Emergency Response');
        }, 1000);
    });

    document.getElementById('changedResponse').addEventListener('click', function() {
        const text = "The situation has changed.";
        addMessage(text, 'sent');
        showToast('Status update sent', 'exchange-alt');
        
        setTimeout(() => {
            addMessage("Please provide details on how the situation has changed so we can adjust our response accordingly. Are you still at Morning Brew? Do you still feel threatened?", 'received', 'Safelyne Emergency Response');
        }, 1000);
    });

    document.getElementById('medicalResponse').addEventListener('click', function() {
        const text = "I need medical assistance.";
        addMessage(text, 'sent');
        showToast('Medical alert sent', 'heartbeat');
        
        setTimeout(() => {
            addMessage("Medical units have been dispatched to your location. ETA 4 minutes. Police will arrive first in 2 minutes. Do you need immediate first aid instructions while you wait?", 'received', 'Safelyne Emergency Response');
            
            // Add system message
            addMessage("Medical response activated • Paramedics dispatched", 'system');
        }, 1000);
    });

    // Emergency action buttons
    document.getElementById('dangerAction').addEventListener('click', function() {
        const text = "CRITICAL DANGER ALERT: Situation has escalated, need immediate assistance!";
        addMessage(text, 'sent');
        showToast('Critical alert sent to all responders', 'exclamation-triangle');
        
        // Add system message
        addMessage("⚠️ CRITICAL DANGER ALERT ACTIVATED ⚠️", 'system');
        
        setTimeout(() => {
            addMessage("HIGHEST PRIORITY ESCALATED. All nearby units have been alerted with your exact location. Officers are now 1 minute away and approaching with lights and sirens. Stay on this secure line.", 'received', 'Safelyne Emergency Response');
            updateETA(1);
            // Update timeline
            updateTimelineStatus(3);
        }, 1000);
    });

    document.getElementById('unsafeAction').addEventListener('click', function() {
        const text = "CAUTION ALERT: I feel unsafe, please expedite response.";
        addMessage(text, 'sent');
        showToast('Caution alert sent to responders', 'exclamation');
        
        setTimeout(() => {
            addMessage("Alert upgraded. Officers are approaching with caution and have been notified of your increased concern. ETA now 2 minutes. Please remain inside Morning Brew where staff and other customers are present.", 'received', 'Safelyne Emergency Response');
            updateETA(2);
        }, 1000);
    });

    document.getElementById('medicalAction').addEventListener('click', function() {
        const text = "MEDICAL EMERGENCY: I need urgent medical attention.";
        addMessage(text, 'sent');
        showToast('Medical emergency alert sent', 'first-aid');
        
        // Add system message
        addMessage("🚑 Medical emergency services dispatched", 'system');
        
        setTimeout(() => {
            addMessage("Medical emergency units dispatched to Morning Brew, Pine St & 5th Ave. Paramedics ETA 4 minutes. Police will arrive first in 2 minutes. What is the nature of your medical emergency?", 'received', 'Safelyne Emergency Response');
            updateETA(2);
        }, 1000);
    });

    // Voice input mock functionality
    document.querySelector('.mic-button').addEventListener('click', function() {
        showToast('Voice recognition activated... Speak now', 'microphone');
        
        // Simulate voice recognition after 2 seconds
        setTimeout(() => {
            document.querySelector('.chat-input').value = "I'm still at the coffee shop waiting. The person has left the area.";
            showToast('Voice captured', 'microphone-alt');
        }, 2000);
    });

    // Map control buttons - for demonstration
    document.querySelectorAll('.map-control-btn').forEach(button => {
        button.addEventListener('click', function() {
            showToast('Map functionality would be active in the live app', 'map-marker-alt');
        });
    });
    
    // Start location update simulation
    simulateLocationUpdates();
    
    // Simulate automatic updates
    setTimeout(() => {
        // Update ETA automatically after some time
        updateETA(2);
        addMessage("Update: Officers are now 2 minutes from your location at Morning Brew, Pine St & 5th Ave.", 'received', 'Safelyne Emergency Response');
    }, 15000);

    setTimeout(() => {
        // Simulate a call notice
        addMessage("An emergency responder would like to call you directly. Would you like to accept the call?", 'received', 'Safelyne Emergency Response');
        
        // Add call accept/decline buttons
        const callResponseOptions = document.createElement('div');
        callResponseOptions.className = 'quick-responses';
        callResponseOptions.innerHTML = `
            <div class="quick-response" id="acceptCall">
                <i class="fas fa-phone"></i>
                <span>Accept Call</span>
            </div>
            <div class="quick-response" id="declineCall">
                <i class="fas fa-phone-slash"></i>
                <span>Decline Call</span>
            </div>
        `;
        
        chatMessages.appendChild(callResponseOptions);
        
        // Add event listeners to call response options
        document.getElementById('acceptCall').addEventListener('click', function() {
            simulateIncomingCall("Officer Johnson");
            callResponseOptions.remove();
        });
        
        document.getElementById('declineCall').addEventListener('click', function() {
            addMessage("I prefer to communicate via text.", 'sent');
            callResponseOptions.remove();
            
            setTimeout(() => {
                addMessage("That's fine. We'll continue our communication here. Officers are now less than a minute away from your location. They will identify themselves when they arrive.", 'received', 'Safelyne Emergency Response');
                updateETA("<1");
            }, 1000);
        });
    }, 25000);

    setTimeout(() => {
        // Final update - officers arriving
        updateTimelineStatus(3);
        updateETA("< 1");
        addMessage("Officers now arriving at Morning Brew. They are in uniform and will identify themselves as responding to your Safelyne alert. Please confirm when they reach you.", 'system');
    }, 35000);
    
    // Simulate officers on scene after 45 seconds
    setTimeout(() => {
        updateTimelineStatus(4);
        updateEmergencyStatus('On Scene');
        updateETA('0');
        addMessage("Officers have verified they are now with you. You are safe. Would you like me to stay connected while they assist you?", 'received', 'Safelyne Emergency Response');
        
        // Add response options
        const officerResponseOptions = document.createElement('div');
        officerResponseOptions.className = 'quick-responses';
        officerResponseOptions.innerHTML = `
            <div class="quick-response" id="stayConnected">
                <i class="fas fa-link"></i>
                <span>Stay Connected</span>
            </div>
            <div class="quick-response" id="endEmergency">
                <i class="fas fa-check-circle"></i>
                <span>End Emergency</span>
            </div>
        `;
        
        chatMessages.appendChild(officerResponseOptions);
        
        // Add event listeners
        document.getElementById('stayConnected').addEventListener('click', function() {
            addMessage("Yes, please stay connected while I speak with the officers.", 'sent');
            officerResponseOptions.remove();
            
            setTimeout(() => {
                addMessage("I'll remain connected. Take your time speaking with the officers. Let me know when you're ready to end this emergency session.", 'received', 'Safelyne Emergency Response');
            }, 1000);
        });
        
        document.getElementById('endEmergency').addEventListener('click', function() {
            addMessage("I'm with the officers now and feel safe. We can end the emergency.", 'sent');
            officerResponseOptions.remove();
            
            setTimeout(() => {
                resolveEmergency();
            }, 1000);
        });
    }, 45000);
    
    // Add back button functionality
    document.querySelector('.back-button').addEventListener('click', function() {
        // Show confirmation dialog before leaving emergency chat
        const confirmation = confirm("Are you sure you want to leave this emergency chat? The emergency session will remain active in the background.");
        
        if (confirmation) {
            // In a real app, would redirect to home but maintain the emergency session
            showToast('This would redirect to home in a real application', 'home');
        }
    });
});