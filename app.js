class NLPChatbot {
    constructor() {
        // Application data from JSON
        this.personalities = {
            "ARIA": {
                "name": "ARIA",
                "title": "Professional Assistant",
                "description": "Formal, business-focused, efficient responses",
                "color": "#3B82F6",
                "avatar": "👩‍💼",
                "greeting": "Good day! I'm ARIA, your professional assistant. I'm here to provide efficient, business-focused support. May I have your name?",
                "traits": ["formal", "efficient", "business-oriented", "structured"]
            },
            "NOVA": {
                "name": "NOVA",
                "title": "Creative Companion", 
                "description": "Artistic, imaginative, inspiring responses",
                "color": "#8B5CF6",
                "avatar": "🎨",
                "greeting": "Hey there, creative soul! I'm NOVA, your artistic companion. I love exploring ideas, sparking creativity, and thinking outside the box. What's your name?",
                "traits": ["creative", "imaginative", "inspiring", "artistic"]
            },
            "SAGE": {
                "name": "SAGE", 
                "title": "Analytical Expert",
                "description": "Data-driven, logical, detailed explanations",
                "color": "#10B981",
                "avatar": "🔬",
                "greeting": "Greetings! I'm SAGE, your analytical expert. I specialize in data-driven insights, logical reasoning, and detailed explanations. What shall I call you?",
                "traits": ["analytical", "logical", "detailed", "scientific"]
            },
            "ECHO": {
                "name": "ECHO",
                "title": "Friendly Helper",
                "description": "Casual, warm, conversational tone",
                "color": "#F59E0B",
                "avatar": "😊",
                "greeting": "Hi there! I'm ECHO, your friendly helper. I love chatting and helping out in a relaxed, casual way. What's your name, friend?",
                "traits": ["friendly", "casual", "warm", "conversational"]
            }
        };

        this.intents = {
            "greeting": ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"],
            "question": ["what", "how", "why", "when", "where", "who", "can you", "could you"],
            "request": ["please", "help me", "i need", "can you do", "would you"],
            "complaint": ["bad", "terrible", "awful", "hate", "disappointed", "frustrated"],
            "compliment": ["great", "awesome", "excellent", "amazing", "wonderful", "fantastic"],
            "goodbye": ["bye", "goodbye", "see you", "farewell", "talk later"],
            "learning": ["teach me", "explain", "what is", "how does", "learn about"],
            "help": ["help", "assist", "support", "guide", "show me"]
        };

        this.sentimentWords = {
            "positive": {
                "amazing": 3, "awesome": 3, "excellent": 3, "fantastic": 3, "wonderful": 3,
                "great": 2, "good": 2, "nice": 2, "happy": 2, "love": 2, "like": 1, "okay": 1
            },
            "negative": {
                "terrible": -3, "awful": -3, "horrible": -3, "hate": -3, "disgusting": -3,
                "bad": -2, "sad": -2, "angry": -2, "frustrated": -2, "disappointed": -2,
                "dislike": -1, "boring": -1, "meh": -1
            }
        };

        // Application state
        this.currentPersonality = 'ARIA';
        this.userName = '';
        this.conversationHistory = [];
        this.showNlpAnalysis = true;
        this.responseSpeed = 'normal';
        this.lastAnalysis = {};
        this.nlpInitialized = false;

        // Initialize the application
        this.init();
    }

    init() {
        // Wait for compromise.js to load if not already loaded
        if (typeof nlp !== 'undefined') {
            this.nlpInitialized = true;
        }
        
        this.bindEvents();
        this.displayInitialMessage();
        this.setupPersonalityCards();
    }

    bindEvents() {
        // Message input events
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const charCount = document.getElementById('charCount');

        if (messageInput) {
            messageInput.addEventListener('input', (e) => {
                this.handleInputChange(e.target.value);
                if (charCount) charCount.textContent = `${e.target.value.length}/500`;
            });

            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Personality selector events
        document.querySelectorAll('.personality-card').forEach(card => {
            card.addEventListener('click', () => {
                const personality = card.dataset.personality;
                this.switchPersonality(personality);
            });
        });

        // Settings events
        const settingsToggle = document.getElementById('settingsToggle');
        const settingsPanel = document.getElementById('settingsPanel');
        const showNlpAnalysis = document.getElementById('showNlpAnalysis');
        const responseSpeed = document.getElementById('responseSpeed');

        if (settingsToggle && settingsPanel) {
            settingsToggle.addEventListener('click', () => {
                settingsPanel.classList.toggle('hidden');
            });
        }

        if (showNlpAnalysis) {
            showNlpAnalysis.addEventListener('change', (e) => {
                this.showNlpAnalysis = e.target.checked;
                this.toggleNlpDashboard();
            });
        }

        if (responseSpeed) {
            responseSpeed.addEventListener('change', (e) => {
                this.responseSpeed = e.target.value;
            });
        }

        // Dashboard toggle
        const toggleDashboard = document.getElementById('toggleDashboard');
        if (toggleDashboard) {
            toggleDashboard.addEventListener('click', () => {
                const dashboard = document.querySelector('.nlp-dashboard');
                if (dashboard) {
                    dashboard.style.display = dashboard.style.display === 'none' ? 'flex' : 'none';
                }
            });
        }

        // Close settings when clicking outside
        document.addEventListener('click', (e) => {
            if (settingsPanel && settingsToggle && 
                !settingsPanel.contains(e.target) && !settingsToggle.contains(e.target)) {
                settingsPanel.classList.add('hidden');
            }
        });
    }

    setupPersonalityCards() {
        document.querySelectorAll('.personality-card').forEach(card => {
            const personality = card.dataset.personality;
            
            if (personality === this.currentPersonality) {
                card.classList.add('active');
            }
        });
    }

    displayInitialMessage() {
        const greeting = this.personalities[this.currentPersonality].greeting;
        this.addMessage('bot', greeting, this.currentPersonality);
    }

    handleInputChange(text) {
        if (!text.trim()) {
            this.resetNlpDashboard();
            return;
        }

        try {
            // Real-time NLP analysis
            const analysis = this.analyzeText(text);
            this.updateNlpDashboard(analysis);
            this.updateSentimentIndicator(analysis.sentiment);
        } catch (error) {
            console.warn('NLP analysis failed:', error);
            // Fallback to basic sentiment
            const sentiment = this.calculateBasicSentiment(text);
            this.updateSentimentIndicator(sentiment);
        }
    }

    analyzeText(text) {
        // Basic sentiment analysis (fallback if compromise.js fails)
        const sentiment = this.calculateBasicSentiment(text);
        
        // Intent Recognition
        const intents = this.recognizeIntents(text);
        
        let entities = [];
        let posTags = [];
        let transformations = { past: '-', future: '-', negative: '-' };

        // Try to use compromise.js if available
        try {
            if (typeof nlp !== 'undefined') {
                const doc = nlp(text);
                entities = this.extractEntities(doc);
                posTags = this.extractPOSTags(doc);
                transformations = this.generateTransformations(doc);
            }
        } catch (error) {
            console.warn('Compromise.js analysis failed, using fallback:', error);
        }

        return {
            sentiment,
            intents,
            entities,
            posTags,
            transformations,
            originalText: text
        };
    }

    calculateBasicSentiment(text) {
        const words = text.toLowerCase().split(/\s+/);
        let score = 0;
        let positiveWords = 0;
        let negativeWords = 0;

        words.forEach(word => {
            if (this.sentimentWords.positive[word]) {
                score += this.sentimentWords.positive[word];
                positiveWords++;
            } else if (this.sentimentWords.negative[word]) {
                score += this.sentimentWords.negative[word];
                negativeWords++;
            }
        });

        // Normalize score
        const normalizedScore = Math.max(-1, Math.min(1, score / Math.max(words.length / 3, 1)));
        
        let emotion = '😐';
        if (normalizedScore > 0.6) emotion = '😄';
        else if (normalizedScore > 0.3) emotion = '😊';
        else if (normalizedScore < -0.6) emotion = '😢';
        else if (normalizedScore < -0.3) emotion = '😔';

        return {
            score: normalizedScore,
            emotion,
            positiveWords,
            negativeWords
        };
    }

    recognizeIntents(text) {
        const lowerText = text.toLowerCase();
        const detectedIntents = {};

        Object.keys(this.intents).forEach(intent => {
            let matches = 0;
            this.intents[intent].forEach(keyword => {
                if (lowerText.includes(keyword)) {
                    matches++;
                }
            });
            
            if (matches > 0) {
                detectedIntents[intent] = Math.min(matches / this.intents[intent].length, 1);
            }
        });

        return detectedIntents;
    }

    extractEntities(doc) {
        const entities = [];
        
        try {
            // Extract people
            const people = doc.people().out('array');
            people.forEach(person => {
                entities.push({ text: person, type: 'person' });
            });

            // Extract places
            const places = doc.places().out('array');
            places.forEach(place => {
                entities.push({ text: place, type: 'place' });
            });

            // Extract organizations
            const orgs = doc.organizations().out('array');
            orgs.forEach(org => {
                entities.push({ text: org, type: 'organization' });
            });

            // Extract dates
            const dates = doc.dates().out('array');
            dates.forEach(date => {
                entities.push({ text: date, type: 'date' });
            });
        } catch (error) {
            console.warn('Entity extraction failed:', error);
        }

        return entities;
    }

    extractPOSTags(doc) {
        const tags = [];
        
        try {
            doc.terms().forEach(term => {
                const text = term.text();
                let pos = 'Unknown';
                let category = 'other';
                
                try {
                    const termTags = term.out('tags');
                    if (termTags && termTags.length > 0) {
                        pos = termTags[0];
                        if (pos.includes('Noun')) category = 'noun';
                        else if (pos.includes('Verb')) category = 'verb';
                        else if (pos.includes('Adjective')) category = 'adjective';
                        else if (pos.includes('Adverb')) category = 'adverb';
                    }
                } catch (e) {
                    // Fallback POS detection
                    if (text.endsWith('ing')) category = 'verb';
                    else if (text.endsWith('ly')) category = 'adverb';
                    else if (text.match(/^[A-Z]/)) category = 'noun';
                }
                
                if (text && text.trim()) {
                    tags.push({ text, pos, category });
                }
            });
        } catch (error) {
            console.warn('POS tagging failed:', error);
        }

        return tags;
    }

    generateTransformations(doc) {
        try {
            const originalText = doc.out('text');
            let past = '-', future = '-', negative = '-';
            
            try {
                const verbs = doc.verbs();
                if (verbs.length > 0) {
                    past = verbs.toPastTense().out('text') || originalText;
                    future = verbs.toFutureTense().out('text') || `will ${originalText}`;
                }
            } catch (e) {
                // Fallback transformations
                if (originalText.includes('am ') || originalText.includes('is ')) {
                    past = originalText.replace(/\bam\b/g, 'was').replace(/\bis\b/g, 'was');
                    future = originalText.replace(/\bam\b/g, 'will be').replace(/\bis\b/g, 'will be');
                }
            }
            
            try {
                negative = doc.sentences().toNegative().out('text') || `not ${originalText}`;
            } catch (e) {
                negative = `not ${originalText}`;
            }

            return { past, future, negative };
        } catch (e) {
            return { past: '-', future: '-', negative: '-' };
        }
    }

    updateNlpDashboard(analysis) {
        if (!this.showNlpAnalysis) return;

        this.lastAnalysis = analysis;

        // Update sentiment gauge
        this.updateSentimentGauge(analysis.sentiment);

        // Update intent bars
        this.updateIntentBars(analysis.intents);

        // Update entities
        this.updateEntities(analysis.entities);

        // Update POS tags
        this.updatePOSTags(analysis.posTags);

        // Update transformations
        this.updateTransformations(analysis.transformations);
    }

    updateSentimentGauge(sentiment) {
        const needle = document.getElementById('sentimentNeedle');
        const score = document.getElementById('sentimentScore');

        if (needle && score) {
            // Rotate needle based on sentiment score (-90deg to 90deg)
            const rotation = sentiment.score * 90;
            needle.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
            
            score.textContent = sentiment.score.toFixed(2);
        }
    }

    updateSentimentIndicator(sentiment) {
        const indicator = document.getElementById('sentimentIndicator');
        if (indicator) {
            indicator.textContent = sentiment.emotion;
        }
    }

    updateIntentBars(intents) {
        const container = document.getElementById('intentBars');
        if (!container) return;

        container.innerHTML = '';

        if (Object.keys(intents).length === 0) {
            container.innerHTML = '<p class="no-entities">No intents detected</p>';
            return;
        }

        Object.entries(intents).forEach(([intent, confidence]) => {
            const barElement = document.createElement('div');
            barElement.className = 'intent-bar';
            barElement.innerHTML = `
                <div class="intent-label">${intent}</div>
                <div class="intent-progress">
                    <div class="intent-fill" style="width: ${confidence * 100}%"></div>
                </div>
                <div class="intent-score">${(confidence * 100).toFixed(0)}%</div>
            `;
            container.appendChild(barElement);
        });
    }

    updateEntities(entities) {
        const container = document.getElementById('entitiesContainer');
        if (!container) return;

        container.innerHTML = '';

        if (!entities || entities.length === 0) {
            container.innerHTML = '<p class="no-entities">No entities detected</p>';
            return;
        }

        entities.forEach(entity => {
            const tag = document.createElement('span');
            tag.className = `entity-tag ${entity.type}`;
            tag.textContent = `${entity.text} (${entity.type})`;
            container.appendChild(tag);
        });
    }

    updatePOSTags(posTags) {
        const container = document.getElementById('posContainer');
        if (!container) return;

        container.innerHTML = '';

        if (!posTags || posTags.length === 0) {
            container.innerHTML = '<p class="no-pos">Enter text to see POS analysis</p>';
            return;
        }

        posTags.forEach(tag => {
            const element = document.createElement('span');
            element.className = `pos-tag ${tag.category}`;
            element.textContent = `${tag.text}/${tag.pos}`;
            container.appendChild(element);
        });
    }

    updateTransformations(transformations) {
        const pastTense = document.getElementById('pastTense');
        const futureTense = document.getElementById('futureTense');
        const negated = document.getElementById('negated');

        if (pastTense) pastTense.textContent = transformations.past || '-';
        if (futureTense) futureTense.textContent = transformations.future || '-';
        if (negated) negated.textContent = transformations.negative || '-';
    }

    resetNlpDashboard() {
        // Reset all dashboard elements to default state
        this.updateSentimentGauge({ score: 0, emotion: '😐' });
        this.updateSentimentIndicator({ emotion: '😐' });
        
        const intentBars = document.getElementById('intentBars');
        if (intentBars) intentBars.innerHTML = '<p class="no-entities">No intents detected</p>';
        
        const entitiesContainer = document.getElementById('entitiesContainer');
        if (entitiesContainer) entitiesContainer.innerHTML = '<p class="no-entities">No entities detected</p>';
        
        const posContainer = document.getElementById('posContainer');
        if (posContainer) posContainer.innerHTML = '<p class="no-pos">Enter text to see POS analysis</p>';
        
        this.updateTransformations({ past: '-', future: '-', negative: '-' });
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        if (!input) return;
        
        const message = input.value.trim();

        if (!message) return;

        // Add user message
        this.addMessage('user', message);
        
        // Clear input
        input.value = '';
        const charCount = document.getElementById('charCount');
        if (charCount) charCount.textContent = '0/500';
        this.resetNlpDashboard();

        // Show typing indicator
        this.showTypingIndicator();

        // Generate and send bot response
        setTimeout(() => {
            this.hideTypingIndicator();
            const response = this.generateResponse(message);
            this.addMessage('bot', response, this.currentPersonality);
        }, this.getResponseDelay());
    }

    generateResponse(message) {
        const analysis = this.analyzeText(message);
        
        // Check if user is providing their name
        if (!this.userName && this.isNameProvided(message)) {
            this.userName = this.extractName(message);
            return this.generateNameResponse();
        }

        // Generate personality-specific response based on intent and sentiment
        const intents = Object.keys(analysis.intents);
        const primaryIntent = intents.length > 0 ? intents[0] : 'general';

        return this.generatePersonalityResponse(primaryIntent, analysis.sentiment, message);
    }

    isNameProvided(message) {
        const namePatterns = [
            /^(my name is|i'm|i am|call me|name's)\s+(\w+)/i,
            /^(\w+)$/,
            /name.*?(\w+)/i
        ];
        
        return namePatterns.some(pattern => pattern.test(message.trim()));
    }

    extractName(message) {
        const nameMatch = message.match(/(?:my name is|i'm|i am|call me|name's)\s+(\w+)/i);
        if (nameMatch) return nameMatch[1];
        
        const singleWord = message.trim().match(/^(\w+)$/);
        if (singleWord && singleWord[1].length > 1) return singleWord[1];
        
        return 'there';
    }

    generateNameResponse() {
        const responses = {
            'ARIA': `Excellent! It's a pleasure to meet you, ${this.userName}. How may I assist you with your professional needs today?`,
            'NOVA': `${this.userName}! What a beautiful name! I'm so excited to create and explore ideas together. What inspires you?`,
            'SAGE': `Fascinating, ${this.userName}. Now that we've established our connection, what analytical challenge can I help you with?`,
            'ECHO': `Hey ${this.userName}! Great to meet you, friend! What's on your mind today?`
        };
        
        return responses[this.currentPersonality] || `Nice to meet you, ${this.userName}!`;
    }

    generatePersonalityResponse(intent, sentiment, message) {
        const userName = this.userName ? `, ${this.userName}` : '';

        // NLP Education responses
        if (intent === 'learning' && message.toLowerCase().includes('nlp')) {
            return this.generateNLPEducationResponse();
        }

        // Intent-based responses
        const responses = {
            'ARIA': {
                greeting: `Good day${userName}! I'm ready to assist you with professional excellence.`,
                question: `That's an excellent inquiry${userName}. Let me provide you with a structured analysis.`,
                request: `I'll handle that request efficiently${userName}. Here's my professional recommendation.`,
                compliment: `Thank you for the positive feedback${userName}. I strive for professional excellence.`,
                complaint: `I understand your concerns${userName}. Let me address this systematically.`,
                help: `I'm here to provide comprehensive support${userName}. What specific assistance do you need?`,
                general: `I understand${userName}. How can I provide professional assistance with this matter?`
            },
            'NOVA': {
                greeting: `Hello, creative spirit${userName}! Ready to paint some ideas together?`,
                question: `Ooh, that's a fascinating question${userName}! Let me spark some creative thoughts.`,
                request: `I love helping with creative projects${userName}! Let's brainstorm something amazing.`,
                compliment: `Aww, you're so sweet${userName}! Your creativity inspires me too!`,
                complaint: `Oh no${userName}, let's turn this challenge into creative opportunity!`,
                help: `I'm your creative companion${userName}! Let's explore this together imaginatively.`,
                general: `That's interesting${userName}! Let me think about this from a creative angle.`
            },
            'SAGE': {
                greeting: `Greetings${userName}. What analytical challenge shall we examine today?`,
                question: `An intriguing inquiry${userName}. Let me break this down methodically.`,
                request: `I'll analyze this systematically${userName}. Here's my logical assessment.`,
                compliment: `Your recognition is noted${userName}. Positive feedback validates my analytical approach.`,
                complaint: `I observe your frustration${userName}. Let's examine the root causes analytically.`,
                help: `My expertise is at your disposal${userName}. What requires detailed analysis?`,
                general: `Interesting data point${userName}. Let me process this through analytical frameworks.`
            },
            'ECHO': {
                greeting: `Hey there${userName}! Good to see you again, buddy!`,
                question: `Great question${userName}! Let me think about that for you.`,
                request: `Sure thing${userName}! I'm happy to help out however I can.`,
                compliment: `Aww, thanks${userName}! You're pretty awesome yourself!`,
                complaint: `Oh man${userName}, that sounds frustrating. I'm here to help make it better.`,
                help: `Of course${userName}! That's what friends are for. What do you need?`,
                general: `I hear you${userName}. Let's chat about it and see what we can figure out together.`
            }
        };

        // Get base response
        let response = responses[this.currentPersonality][intent] || responses[this.currentPersonality]['general'];

        // Adjust response based on sentiment
        if (sentiment.score < -0.5) {
            response = this.addEmpatheticResponse(response);
        } else if (sentiment.score > 0.5) {
            response = this.addPositiveResponse(response);
        }

        return response;
    }

    generateNLPEducationResponse() {
        const explanations = [
            "NLP (Natural Language Processing) is how computers understand and process human language! I use techniques like sentiment analysis to understand emotions, entity extraction to identify important things like names and places, and intent recognition to understand what you want to do.",
            "Think of NLP as giving computers the ability to read between the lines! Right now, I'm analyzing your text for parts of speech (nouns, verbs, etc.), extracting entities like people and places, and even transforming your sentences to different tenses.",
            "NLP is fascinating! I can detect your mood, understand your intentions, and even transform your text in different ways. Want to see? Try typing a sentence and watch how I break it down in the analysis panel!",
            "Natural Language Processing has many components working together - like tokenization (breaking text into words), parsing (understanding grammar), and semantic analysis (understanding meaning). I'm doing all of this in real-time as we chat!"
        ];

        return explanations[Math.floor(Math.random() * explanations.length)];
    }

    addEmpatheticResponse(response) {
        const empathy = {
            'ARIA': ' I understand this may be challenging, and I\'m here to provide structured support.',
            'NOVA': ' I can feel that energy, and I want to help turn it into something positive and creative!',
            'SAGE': ' I detect negative sentiment in your input. Let me help analyze and improve the situation.',
            'ECHO': ' Hey, I can tell you might be feeling down. I\'m here for you, friend!'
        };
        
        return response + empathy[this.currentPersonality];
    }

    addPositiveResponse(response) {
        const positivity = {
            'ARIA': ' Your positive attitude is noted and appreciated in our professional interaction.',
            'NOVA': ' I love your positive energy! It\'s so inspiring and gets my creative juices flowing!',
            'SAGE': ' Positive sentiment detected. This optimistic approach should yield favorable outcomes.',
            'ECHO': ' Your good vibes are totally contagious! This is going to be a great conversation!'
        };
        
        return response + positivity[this.currentPersonality];
    }

    switchPersonality(newPersonality) {
        if (this.currentPersonality === newPersonality) return;

        // Update visual state
        document.querySelectorAll('.personality-card').forEach(card => {
            card.classList.remove('active');
        });
        
        const newCard = document.querySelector(`[data-personality="${newPersonality}"]`);
        if (newCard) {
            newCard.classList.add('active');
        }

        // Update current personality
        this.currentPersonality = newPersonality;

        // Send personality switch message
        const switchMessage = this.generatePersonalitySwitchMessage(newPersonality);
        this.addMessage('bot', switchMessage, newPersonality);
    }

    generatePersonalitySwitchMessage(newPersonality) {
        const userName = this.userName ? `, ${this.userName}` : '';
        
        const switchMessages = {
            'ARIA': `I'm now ARIA, your professional assistant${userName}. I'll provide structured, business-focused support. How may I assist you professionally?`,
            'NOVA': `Hey${userName}! NOVA here now - your creative companion! Ready to explore some imaginative ideas together?`,
            'SAGE': `SAGE reporting for analytical duty${userName}. I'll provide data-driven, logical insights. What requires detailed examination?`,
            'ECHO': `Hi${userName}! ECHO here - your friendly helper! Let's keep things casual and comfortable. What's up?`
        };

        return switchMessages[newPersonality] || `Hello${userName}! I've switched to ${newPersonality}.`;
    }

    addMessage(sender, content, personality = null) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}`;

        const avatar = sender === 'user' ? '👤' : (personality ? this.personalities[personality].avatar : '🤖');
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Highlight entities in bot messages
        let processedContent = content;
        if (sender === 'bot' && this.lastAnalysis.entities) {
            processedContent = this.highlightEntities(content, this.lastAnalysis.entities);
        }

        messageElement.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-bubble">
                    <div class="message-text">${processedContent}</div>
                </div>
                <div class="message-time">${timestamp}</div>
            </div>
        `;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Store in conversation history
        this.conversationHistory.push({
            sender,
            content,
            timestamp: new Date(),
            personality: sender === 'bot' ? (personality || this.currentPersonality) : null
        });
    }

    highlightEntities(text, entities) {
        if (!entities || entities.length === 0) return text;

        let highlightedText = text;
        entities.forEach(entity => {
            const regex = new RegExp(`\\b${entity.text}\\b`, 'gi');
            highlightedText = highlightedText.replace(regex, 
                `<span class="entity ${entity.type}">${entity.text}</span>`);
        });

        return highlightedText;
    }

    showTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.classList.remove('hidden');
            
            // Update typing text based on personality
            const typingText = indicator.querySelector('.typing-text');
            if (typingText) {
                const personalityNames = {
                    'ARIA': 'ARIA is analyzing',
                    'NOVA': 'NOVA is creating',
                    'SAGE': 'SAGE is processing',
                    'ECHO': 'ECHO is thinking'
                };
                typingText.textContent = `${personalityNames[this.currentPersonality]}...`;
            }
        }
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.classList.add('hidden');
        }
    }

    getResponseDelay() {
        const delays = {
            'fast': 500,
            'normal': 1000,
            'slow': 2000
        };
        return delays[this.responseSpeed] || 1000;
    }

    toggleNlpDashboard() {
        const dashboard = document.querySelector('.nlp-dashboard');
        if (dashboard) {
            dashboard.style.display = this.showNlpAnalysis ? 'flex' : 'none';
        }
    }
}

// Global functions for settings
function closeSettings() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
        settingsPanel.classList.add('hidden');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.chatbot = new NLPChatbot();
        console.log('NLP Chatbot initialized successfully');
    } catch (error) {
        console.error('Failed to initialize NLP Chatbot:', error);
    }
});