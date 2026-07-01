const form = document.getElementById("watchlistForm");
const hoursModeToggle = document.getElementById("hoursModeToggle");

chrome.storage.sync.get({ hoursMode: false }, ({ hoursMode }) => {
  hoursModeToggle.checked = hoursMode;
});
hoursModeToggle.addEventListener("change", () => {
  chrome.storage.sync.set({ hoursMode: hoursModeToggle.checked });
});
const input = document.getElementById("usernameInput");
const spinner = document.getElementById("spinner");
const results = document.getElementById("results");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = input.value.trim();
  if (!username) {
    showError("User is required.");
    return;
  }

  spinner.style.display = "block";
  results.innerHTML = "";

  // Fetch watchlist
  const watchlistURL = `https://letterboxd.com/${username}/watchlist/`;
  chrome.runtime.sendMessage({ action: "fetchUrl", url: watchlistURL }, ({html}) => {
    if (!html) {
      showError("Failed to load watchlist.");
      return;
    }

    const watchlistDoc = new DOMParser().parseFromString(html, 'text/html');
    const movieLinks = Array.from(watchlistDoc.querySelectorAll('[data-target-link]'))
      .map(movieElement => 'https://letterboxd.com' + movieElement.getAttribute('data-target-link'));

    const randomMovies = pickRandom(movieLinks, 3);

    // Fetch Reviews
    fetchReviews(randomMovies)
      .then((reviewData) => {
        if (reviewData.length === 0) {
          showError("No reviews found.");
          return;
        } else {
          spinner.style.display = "none";
          renderReviews(reviewData);
        }
      })
      .catch((err) => {
        console.error("Error fetching reviews:", err);
        showError("Failed to load reviews.");
        return;
      });
  });
});

function showError(error) {
  results.innerHTML = "<span class='error'>"+error+"</span>";
}

function renderReviews(reviewData) {
  results.innerHTML = '';
  reviewData.forEach(({ review, url }, i) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'review-card';
    card.innerHTML = `<p>${review}</p><span class="review-card-cta">Pick this one &rarr;</span>`;
    card.addEventListener('click', () => {
      window.open(url, '_blank');
    });
    results.appendChild(card);
  });
}

// Utility to pick random items from an array
function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

// Separate function for fetching reviews
function fetchReviews(movieLinks) {
  const maxReviewLength = 368;
  const reviewDataPromises = movieLinks.map((url) => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "fetchUrl", url: url+"reviews/by/activity" }, ({html}) => {
        if (!html) {
          resolve(null); // Resolve with null if no reviews
          return;
        }

        const reviewsDoc = new DOMParser().parseFromString(html, 'text/html');
        console.log(reviewsDoc);
        let movieName = "";
        try {
          movieName = reviewsDoc.querySelectorAll('div.contextual-title > h1 > a')[0].innerText.toLowerCase();
        } catch (error) {

        }

        const reviews = Array.from(reviewsDoc.querySelectorAll('div.js-review > div.body-text:not([hidden])'))
          .map(reviewDiv => reviewDiv.innerText)
          .filter(review => (review.length < maxReviewLength && (movieName == "" || !review.toLowerCase().includes(movieName))));

        if (reviews.length === 0) {
          resolve(null); // Resolve with null if no reviews found
        } else {
          const review = pickRandom(reviews, 1);
          resolve({ review, url });
        }
      });
    });
  });

  return Promise.all(reviewDataPromises)
    .then((reviewData) => reviewData.filter(item => item !== null)); // Filter out nulls (failed fetches)
}
