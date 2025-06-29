// script.js

// Initialize quotes array with some sample data
let quotes = [
    { text: "The only way to do great work is to love what you do.", category: "Motivation" },
    { text: "Life is what happens when you're busy making other plans.", category: "Life" },
    { text: "Stay hungry, stay foolish.", category: "Motivation" },
    { text: "The unexamined life is not worth living.", category: "Philosophy" }
  ];
  
  // Variable to store the currently selected category
  let selectedCategory = 'all';
  
  // Load quotes from local storage on initialization
  function loadQuotes() {
    const storedQuotes = localStorage.getItem('quotes');
    if (storedQuotes) {
      quotes = JSON.parse(storedQuotes);
    }
    // Load selected category from local storage
    const storedCategory = localStorage.getItem('selectedCategory');
    if (storedCategory) {
      selectedCategory = storedCategory;
    }
    populateCategories();
    filterQuotes();
  }
  
  // Save quotes to local storage
  function saveQuotes() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
  }
  
  // Show a random quote based on the selected category
  function showRandomQuote() {
    const filteredQuotes = selectedCategory === 'all' 
      ? quotes 
      : quotes.filter(quote => quote.category === selectedCategory);
    
    if (filteredQuotes.length === 0) {
      document.getElementById('quoteDisplay').innerHTML = '<p>No quotes available for this category.</p>';
      return;
    }
  
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const quote = filteredQuotes[randomIndex];
    const quoteElement = document.createElement('p');
    quoteElement.textContent = `"${quote.text}" - ${quote.category}`;
    const quoteDisplay = document.getElementById('quoteDisplay');
    quoteDisplay.innerHTML = '';
    quoteDisplay.appendChild(quoteElement);
  
    // Store the last viewed quote in session storage
    sessionStorage.setItem('lastQuote', JSON.stringify(quote));
  }
  
  // Create the form for adding new quotes
  function createAddQuoteForm() {
    const formDiv = document.createElement('div');
    formDiv.innerHTML = `
      <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
      <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
      <button onclick="addQuote()">Add Quote</button>
    `;
    document.body.appendChild(formDiv);
  }
  
  // Add a new quote to the array, update storage, and post to server
  async function addQuote() {
    const quoteText = document.getElementById('newQuoteText').value.trim();
    const quoteCategory = document.getElementById('newQuoteCategory').value.trim();
  
    if (quoteText && quoteCategory) {
      const newQuote = { text: quoteText, category: quoteCategory };
      quotes.push(newQuote);
      saveQuotes();
      populateCategories();
      filterQuotes();
      document.getElementById('newQuoteText').value = '';
      document.getElementById('newQuoteCategory').value = '';
      
      // Post the new quote to the server
      await postQuoteToServer(newQuote);
      
      alert('Quote added successfully!');
    } else {
      alert('Please enter both a quote and a category.');
    }
  }
  
  // Post a quote to the server using JSONPlaceholder
  async function postQuoteToServer(quote) {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: quote.text,
          body: quote.category,
          userId: 1 // Required by JSONPlaceholder
        })
      });
      if (response.ok) {
        const notification = document.createElement('p');
        notification.textContent = 'Quote successfully sent to server!';
        notification.style.color = 'green';
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 3000);
      } else {
        throw new Error('Failed to post quote to server');
      }
    } catch (error) {
      console.error('Error posting quote to server:', error);
      const notification = document.createElement('p');
      notification.textContent = 'Failed to send quote to server.';
      notification.style.color = 'red';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
    }
  }
  
  // Populate the category filter dropdown
  function populateCategories() {
    const categoryFilter = document.getElementById('categoryFilter');
    const uniqueCategories = ['all', ...new Set(quotes.map(quote => quote.category))];
    
    categoryFilter.innerHTML = '';
    uniqueCategories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      categoryFilter.appendChild(option);
    });
  
    // Set the dropdown to the current selectedCategory
    categoryFilter.value = selectedCategory;
  }
  
  // Filter quotes based on the selected category
  function filterQuotes() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    selectedCategory = categoryFilter;
    localStorage.setItem('selectedCategory', selectedCategory);
    
    const filteredQuotes = selectedCategory === 'all' 
      ? quotes 
      : quotes.filter(quote => quote.category === selectedCategory);
    
    const quoteDisplay = document.getElementById('quoteDisplay');
    quoteDisplay.innerHTML = '';
    if (filteredQuotes.length === 0) {
      quoteDisplay.innerHTML = '<p>No quotes available for this category.</p>';
      return;
    }
  
    filteredQuotes.forEach(quote => {
      const quoteElement = document.createElement('p');
      quoteElement.textContent = `"${quote.text}" - ${quote.category}`;
      quoteDisplay.appendChild(quoteElement);
    });
  }
  
  // Export quotes to a JSON file
  function exportToJsonFile() {
    const dataStr = JSON.stringify(quotes);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quotes.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  // Import quotes from a JSON file
  function importFromJsonFile(event) {
    const fileReader = new FileReader();
    fileReader.onload = async function(event) {
      try {
        const importedQuotes = JSON.parse(event.target.result);
        if (Array.isArray(importedQuotes)) {
          quotes.push(...importedQuotes);
          saveQuotes();
          populateCategories();
          filterQuotes();
          // Post imported quotes to server
          for (const quote of importedQuotes) {
            await postQuoteToServer(quote);
          }
          alert('Quotes imported successfully!');
        } else {
          alert('Invalid JSON format. Please upload a valid quotes file.');
        }
      } catch (e) {
        alert('Error importing quotes. Please ensure the file is a valid JSON.');
      }
    };
    fileReader.readAsText(event.target.files[0]);
  }
  
  // Fetch quotes from the server (JSONPlaceholder)
  async function fetchQuotesFromServer() {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts');
      const serverQuotes = await response.json();
      // Simulate server quotes as { text, category }
      return serverQuotes.slice(0, 5).map(post => ({
        text: post.title,
        category: 'Server'
      }));
    } catch (error) {
      console.error('Error fetching quotes from server:', error);
      return [];
    }
  }
  
  // Sync quotes with the server and handle conflicts
  async function syncQuotes() {
    try {
      const formattedServerQuotes = await fetchQuotesFromServer();
      
      if (formattedServerQuotes.length === 0) {
        const notification = document.createElement('p');
        notification.textContent = 'Failed to fetch quotes from server.';
        notification.style.color = 'red';
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 3000);
        return;
      }
  
      // Conflict resolution: Server data takes precedence for new quotes
      const localQuoteTexts = new Set(quotes.map(q => q.text));
      const newQuotes = formattedServerQuotes.filter(q => !localQuoteTexts.has(q.text));
      
      if (newQuotes.length > 0) {
        // Check for conflicts (e.g., duplicate quotes with different categories)
        const conflicts = [];
        newQuotes.forEach(serverQuote => {
          const existingQuote = quotes.find(q => q.text === serverQuote.text && q.category !== serverQuote.category);
          if (existingQuote) {
            conflicts.push({ local: existingQuote, server: serverQuote });
          }
        });
  
        // Resolve conflicts: Update local quotes with server data
        conflicts.forEach(conflict => {
          const index = quotes.findIndex(q => q.text === conflict.local.text);
          quotes[index] = conflict.server; // Server data takes precedence
        });
  
        // Add new quotes
        quotes.push(...newQuotes.filter(q => !conflicts.some(c => c.server.text === q.text)));
        saveQuotes();
        populateCategories();
        filterQuotes();
        
        // Notify user of sync and conflicts
        const notification = document.createElement('p');
        let message = `${newQuotes.length} new quotes synced from server!`;
        if (conflicts.length > 0) {
          message += ` ${conflicts.length} conflicts resolved (server data applied).`;
        }
        notification.textContent = message;
        notification.style.color = 'green';
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 3000);
      }
    } catch (error) {
      console.error('Error syncing quotes:', error);
      const notification = document.createElement('p');
      notification.textContent = 'Failed to sync quotes with server.';
      notification.style.color = 'red';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
    }
  }
  
  // Initialize the application
  function init() {
    // Load quotes and selected category
    loadQuotes();
  
    // Create category filter dropdown
    const categoryFilterDiv = document.createElement('div');
    categoryFilterDiv.innerHTML = `
      <select id="categoryFilter" onchange="filterQuotes()">
        <option value="all">All Categories</option>
      </select>
    `;
    document.body.insertBefore(categoryFilterDiv, document.getElementById('quoteDisplay'));
  
    // Create import/export buttons
    const ioDiv = document.createElement('div');
    ioDiv.innerHTML = `
      <button onclick="exportToJsonFile()">Export Quotes</button>
      <input type="file" id="importFile" accept=".json" onchange="importFromJsonFile(event)" />
    `;
    document.body.append(lioDiv);
  
    // Create add quote form
    createAddQuoteForm();
  
    // Populate categories and display initial quotes
    populateCategories();
    filterQuotes();
  
    // Show last viewed quote from session storage if available
    const lastQuote = sessionStorage.getItem('lastQuote');
    if (lastQuote) {
      const quote = JSON.parse(lastQuote);
      const quoteElement = document.createElement('p');
      quoteElement.textContent = `"${quote.text}" - ${quote.category} (Last Viewed)`;
      document.getElementById('quoteDisplay').prepend(quoteElement);
    }
  
    // Set up periodic server sync (every 30 seconds)
    setInterval(syncQuotes, 30000);
  }
  
  // Run initialization when the DOM is fully loaded
  document.addEventListener('DOMContentLoaded', init);