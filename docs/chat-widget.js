(function () {
  if (window.ChatWidgetInjected) return;
  window.ChatWidgetInjected = true;

  const config = window.ChatWidgetConfig || {};
  const avatarUrl = config.avatar || 'https://arseniimd.github.io/chat-widget/bot_face.png';
  const socketUrl = config.socket || `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/chat`;

  const style = document.createElement('style');
  style.textContent = `
        #chat-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        #chat-button {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #ec4c60;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        #chat-button:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }

        #chat-button svg {
            width: 24px;
            height: 24px;
            fill: white;
            transition: transform 0.3s ease;
        }

        #chat-button.open svg {
            transform: rotate(45deg);
        }

        #chat-window {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 350px;
            height: 500px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            display: none;
            flex-direction: column;
            overflow: hidden;
            transform: translateY(20px);
            opacity: 0;
            transition: all 0.3s ease;
        }

        #chat-window.open {
            display: flex;
            transform: translateY(0);
            opacity: 1;
        }

        #chat-header {
            background: #ec4c60;
            color: white;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        #chat-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }

        #chat-header .header-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .assistant-avatar-img {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid rgba(255, 255, 255, 0.3);
            flex-shrink: 0;
        }

        .header-text h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }

        .header-text .assistant-name {
            font-size: 13px;
            opacity: 0.9;
            margin: 0;
        }

        .status-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #4CAF50;
            animation: pulse 2s infinite;
            margin-left: 6px;
            vertical-align: middle;
        }

        .status-dot.connecting {
            background: #FFC107;
            animation: blink 1s infinite;
        }

        .status-dot.disconnected {
            background: #F44336;
            animation: none;
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }

        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0.3; }
        }

        #close-chat {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: background 0.2s ease;
        }

        #close-chat:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        #chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: #f8f9fa;
            overflow-x: hidden;
        }

        .message {
            margin-bottom: 12px;
            display: flex;
            flex-direction: column;
        }

        .message.bot {
            align-items: flex-start;
        }

        .message.user {
            align-items: flex-end;
        }

        .message-bubble {
            max-width: 95%;
            padding: 12px 16px;
            border-radius: 18px;
            font-size: 14px;
            line-height: 1.4;
            word-wrap: break-word;
            overflow-wrap: break-word;
            overflow-x: hidden;
            margin: 0;
            box-sizing: border-box;
        }

        .message.bot .message-bubble {
            background: white;
            color: #333;
            border-bottom-left-radius: 4px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .message.user .message-bubble {
            background: #246E78;
            color: white;
            border-bottom-right-radius: 4px;
        }

        .message.error .message-bubble {
            background: linear-gradient(135deg, #ffebee 0%, #fce4ec 100%);
            color: #c62828;
            border: 1px solid #f8bbd9;
            border-bottom-left-radius: 4px;
            box-shadow: 0 2px 8px rgba(198, 40, 40, 0.1);
        }

        .message.error .message-bubble::before {
            content: "⚠️ ";
            margin-right: 8px;
        }

        /* Markdown styling for AI messages */
        .message-bubble h1, .message-bubble h2, .message-bubble h3 {
            margin: 8px 0 4px 0 !important;
            font-weight: 600;
        }

        .message-bubble h1 { font-size: 18px; }
        .message-bubble h2 { font-size: 16px; }
        .message-bubble h3 { font-size: 14px; }

        .message-bubble p {
            margin: 4px 0 !important;
        }

        .message-bubble ol, .message-bubble ul {
            margin: 8px 0 !important;
            padding-left: 20px !important;
        }

        .message-bubble li {
            margin: 2px 0 !important;
            line-height: 1.3 !important;
        }

        .message-bubble strong {
            font-weight: 600;
        }

        .message-bubble em {
            font-style: italic;
        }

        .message-bubble a {
            color: #ec4c60;
            text-decoration: underline;
        }

        .message-bubble code {
            background: #f1f3f4;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
        }

        .message-bubble pre {
            background: #f1f3f4;
            padding: 8px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 8px 0 !important;
        }

        .message-bubble pre code {
            background: none;
            padding: 0;
        }

        .options-container {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 12px 0;
            padding: 0 8px;
        }

        .option-button {
            background: white;
            border: 1px solid #e1e5e9;
            border-radius: 16px;
            padding: 8px 14px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
            color: #333;
        }

        .option-button:hover:not(:disabled) {
            background: #f8f9fa;
            border-color: #FF3E56;
            color: #FF3E56;
        }

        .option-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .message-time {
            font-size: 11px;
            color: #999;
            margin: 4px 8px 0;
        }

        #chat-input-container {
            padding: 16px 20px;
            background: white;
            border-top: 1px solid #e1e5e9;
            display: flex;
            gap: 8px;
        }

        #chat-input {
            flex: 1;
            border: 1px solid #e1e5e9;
            border-radius: 20px;
            padding: 10px 16px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s ease;
        }

        #chat-input:focus {
            border-color: #ec4c60;
        }

        #send-button {
            background: #ec4c60;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s ease;
        }

        #send-button:hover {
            transform: scale(1.05);
        }

        #send-button svg {
            width: 16px;
            height: 16px;
            fill: white;
        }

        .typing-indicator {
            display: none;
            align-items: center;
            gap: 4px;
            padding: 12px 16px;
            background: white;
            border-radius: 18px;
            border-bottom-left-radius: 4px;
            max-width: 80%;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .typing-dot {
            width: 6px;
            height: 6px;
            background: #999;
            border-radius: 50%;
            animation: typing 1.4s infinite;
        }

        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        .no-bold {
            font-weight: normal !important;
        }

        @keyframes typing {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-10px); }
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
            #chat-window {
                width: 300px;
                height: 450px;
            }
        }

        @media (max-width: 480px) {
            #chat-widget {
                bottom: 15px;
                right: 15px;
            }
            
            #chat-window {
                width: calc(100vw - 30px);
                height: 70vh;
                right: -10px;
            }
        }
  `;

  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/marked/5.1.1/marked.min.js';
  script.crossOrigin = 'anonymous';

  script.onload = () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectWidget);
    } else {
      injectWidget();
    }

    function injectWidget() {
        document.head.appendChild(style);

        const container = document.createElement('div');
        container.innerHTML = `
        <div id="chat-widget">
            <button id="chat-button">
                <svg viewBox="0 0 24 24">
                    <path d="M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4C22,2.89 21.1,2 20,2Z"/>
                </svg>
            </button>
            
            <div id="chat-window">
                <div id="chat-header">
                    <div class="header-info">
                        <img class="assistant-avatar-img" src="${avatarUrl}" alt="A">
                        <div class="header-text">
                            <h3>Anna <span id="status-dot" class="status-dot"></span></h3>
                            <div class="assistant-name">AI Assistant</div>
                        </div>
                    </div>
                    <button id="close-chat">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                        </svg>
                    </button>
                </div>
                
                <div id="chat-messages"></div>
                
                <div id="chat-input-container">
                    <input type="text" id="chat-input" placeholder="Type your message...">
                    <button id="send-button">
                        <svg viewBox="0 0 24 24">
                            <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        `;
        document.body.appendChild(container);

        const customRenderer = new marked.Renderer();
        customRenderer.link = function(href, title, text) {
            const target = href.replace(/^https?:\/\/[^\/]+\/?/, '').replace(/\/$/, '');
            return `<a href="${href}" class="chat-link" data-chat-target="${target}" target="_blank" rel="noopener">${text}</a>`;
        };
        customRenderer.strong = function(text) {
            return `<span class="no-bold">${text}</span>`;
        };
        marked.setOptions({ renderer: customRenderer });

        class ChatWidget {
            constructor() {
                this.isOpen = false;
                this.socket = null;
                this.aiIsTyping = false;
                this.totalTokens = 0;
                this.messages = [];
                this.isLoadingHistory = false;
                this.init();
            }

            init() {
                this.bindEvents();
                this.connect();
            }

            bindEvents() {
                const chatButton = document.getElementById('chat-button');
                const closeButton = document.getElementById('close-chat');
                const sendButton = document.getElementById('send-button');
                const chatInput = document.getElementById('chat-input');

                chatButton.addEventListener('click', () => this.toggleChat());
                closeButton.addEventListener('click', () => this.closeChat());
                sendButton.addEventListener('click', () => this.sendMessage());
                
                chatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !this.aiIsTyping) {
                        this.sendMessage();
                    }
                });

                window.addEventListener('resize', () => this.adjustChatHeight());
            }

            toggleChat() {
                if (this.isOpen) {
                    this.closeChat();
                } else {
                    this.openChat();
                }
            }

            openChat() {
                const chatWindow = document.getElementById('chat-window');
                const chatButton = document.getElementById('chat-button');
                
                chatWindow.classList.add('open');
                chatButton.classList.add('open');
                this.isOpen = true;
                
                if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
                    this.connect();
                }
                
                setTimeout(() => {
                    this.scrollToBottom();
                    document.getElementById('chat-input').focus();
                }, 300);
            }

            closeChat() {
                const chatWindow = document.getElementById('chat-window');
                const chatButton = document.getElementById('chat-button');
                
                chatWindow.classList.remove('open');
                chatButton.classList.remove('open');
                this.isOpen = false;
            }

            connect() {
                this.updateConnectionStatus('connecting', 'Connecting...');
                
                const proto = location.protocol === 'https:' ? 'wss' : 'ws';
                this.socket = new WebSocket(socketUrl);

                this.socket.onopen = () => {
                    this.updateConnectionStatus('connected', 'Online');
                    this.updateInputAvailability();
                };

                this.socket.onclose = () => {
                    this.updateConnectionStatus('disconnected', 'Reconnecting...');
                    this.updateInputAvailability();
                    setTimeout(() => this.connect(), 3000);
                };

                this.socket.onerror = (error) => {
                    console.error('WebSocket Error:', error);
                    this.updateConnectionStatus('disconnected', 'Connection Error');
                };

                this.socket.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                };
            }

            updateConnectionStatus(status, text) {
                const statusDot = document.getElementById('status-dot');
                statusDot.className = `status-dot ${status}`;
            }

            handleMessage(data) {
                if (data.type !== 'typing') {
                    this.setAITypingStatus(false);
                }

                if (data.type === 'message' && data.is_history) {
                    this.isLoadingHistory = true;
                    const role = data.role || 'ai';
                    const msgType = role === 'user' ? 'user' : 'bot';
                    this.addMessage(msgType, data.content, data.timestamp);
                    return;
                }

                if (this.isLoadingHistory && data.type !== 'message') {
                    this.isLoadingHistory = false;
                    setTimeout(() => this.scrollToBottom(), 50);
                }

                if (data.is_history) {
                    this.hasHistory = true;
                }

                if (!this.autoOpenScheduled) {
                    const delay = this.hasHistory ? 15000 : 15000;
                    this.autoOpenScheduled = true;
                    this.autoOpenTimer = setTimeout(() => {
                        if (!this.isOpen) this.openChat(); 
                    }, delay);
                }

                switch (data.type) {
                    case 'message': {
                        const role = data.role || 'ai';
                        const msgType = role === 'user' ? 'user' : 'bot';
                        this.addMessage(msgType, data.content, data.timestamp);
                        this.scrollToBottom();
                        break;
                    }

                    case 'typing':
                        this.setAITypingStatus(true);
                        break;

                    case 'options':
                        this.addOptions(data.content);
                        this.scrollToBottom();
                        break;

                    case 'error':
                        this.removeOldErrors();
                        this.addMessage('error', data.content);
                        this.scrollToBottom();
                        break;
                }

                if (data.tokens) {
                    this.totalTokens = data.tokens;
                }
            }

            setAITypingStatus(isTyping) {
                this.aiIsTyping = isTyping;
                
                if (isTyping) {
                    this.showTypingIndicator();
                } else {
                    this.hideTypingIndicator();
                }
                
                this.updateInputAvailability();
                this.scrollToBottom();
            }

            updateInputAvailability() {
                const input = document.getElementById('chat-input');
                const sendButton = document.getElementById('send-button');
                const isConnected = this.socket && this.socket.readyState === WebSocket.OPEN;
                
                const shouldDisable = this.aiIsTyping || !isConnected;
                input.disabled = shouldDisable;
                sendButton.disabled = shouldDisable;

                const optionButtons = document.querySelectorAll('.option-button');
                optionButtons.forEach(button => {
                    button.disabled = shouldDisable;
                });
            }

            sendMessage() {
                const input = document.getElementById('chat-input');
                const message = input.value.trim();
                
                if (message === '' || this.aiIsTyping) return;
                
                this.removeOptions();
                
                this.addMessage('user', message);
                input.value = '';
                
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify({ message: message }));
                    this.setAITypingStatus(true);
                } else {
                    this.addMessage('error', 'Connection lost. Please wait while we reconnect...');
                }
            }

            addMessage(type, text, timestamp = null) {
                const messagesContainer = document.getElementById('chat-messages');
                const time = timestamp 
                    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : this.getCurrentTime();
                
                const messageElement = document.createElement('div');
                messageElement.className = `message ${type}`;
                
                let processedText = text;
                
                if (type === 'bot') {
                    processedText = marked.parse(text);
                }
                
                messageElement.innerHTML = `
                    <div class="message-bubble">${processedText}</div>
                    <div class="message-time">${time}</div>
                `;
                
                const typingIndicator = document.getElementById('typing-message');
                if (typingIndicator) {
                    messagesContainer.insertBefore(messageElement, typingIndicator);
                } else {
                    messagesContainer.appendChild(messageElement);
                }
            }

            addOptions(options) {
                const messagesContainer = document.getElementById('chat-messages');
                
                const optionsContainer = document.createElement('div');
                optionsContainer.className = 'options-container';
                
                options.forEach(option => {
                    const button = document.createElement('button');
                    button.className = 'option-button';
                    button.textContent = option;
                    button.onclick = () => {
                        if (!this.aiIsTyping) {
                            this.addMessage('user', option);
                            this.sendMessageText(option);
                            this.setAITypingStatus(true);
                            optionsContainer.remove();
                        }
                    };
                    optionsContainer.appendChild(button);
                });
                
                messagesContainer.appendChild(optionsContainer);
                this.scrollToBottom();
            }

            sendMessageText(text) {
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify({ message: text }));
                }
            }

            removeOptions() {
                const optionsContainer = document.querySelector('.options-container');
                if (optionsContainer) {
                    optionsContainer.remove();
                }
            }

            removeOldErrors() {
                const oldErrors = document.querySelectorAll('.message.error');
                oldErrors.forEach(el => el.remove());
            }

            showTypingIndicator() {
                const messagesContainer = document.getElementById('chat-messages');
                const existingTyping = document.getElementById('typing-message');
                
                if (!existingTyping) {
                    const typingElement = document.createElement('div');
                    typingElement.className = 'message bot';
                    typingElement.id = 'typing-message';
                    typingElement.innerHTML = `
                        <div class="typing-indicator" style="display: flex;">
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                        </div>
                    `;
                    
                    messagesContainer.appendChild(typingElement);
                }
            }

            hideTypingIndicator() {
                const typingMessage = document.getElementById('typing-message');
                if (typingMessage) {
                    typingMessage.remove();
                }
            }

            getCurrentTime() {
                const now = new Date();
                return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            scrollToBottom() {
                const messagesContainer = document.getElementById('chat-messages');
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }

            adjustChatHeight() {
                const chatWindow = document.getElementById('chat-window');
                if (window.innerWidth <= 480) {
                    chatWindow.style.height = '70vh';
                } else {
                    chatWindow.style.height = '500px';
                }
            }
        }
        new ChatWidget();
    }
  };
  document.head.appendChild(script);
})();
