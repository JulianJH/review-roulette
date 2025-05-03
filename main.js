const form = document.getElementById("watchlistForm");
const spinner = document.getElementById("spinner");

// Watchlist Loading
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log(e);

  spinner.style.display = "block"; // show spinner
  try {
    // Guide for pure js webscraping
    // https://medium.com/@pranjaltiwari515/unlocking-the-power-of-web-scraping-with-pure-javascript-a-step-by-step-guide-4517d47ecb64

    const username = document.getElementById('username').value.trim();
    const watchlistURL = `https://letterboxd.com/${username}/watchlist`;

    // api.allorigins.win Pull contents from any page via API (as JSON/P or raw) and avoid Same-origin policy problems
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(watchlistURL)}`);
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const movieLinks = Array.from(doc.querySelectorAll('ul.poster-list > li.poster-container > div'))
      .map(moviePosterDiv => 'https://letterboxd.com' + moviePosterDiv.getAttribute('data-target-link'));

    const randomMovies = pickRandom(movieLinks, 3);

    const reviewData = [];
    for (const url of randomMovies) {
      const review = await fetchRandomReviewFromMoviePage(url);
      if (review) reviewData.push({ review, url });
    }

    renderReviews(reviewData);
  } catch (err) {
    console.error('Error:', err);
    alert('Failed to load watchlist or reviews.');
  } finally {
    spinner.style.display = "none"; // hide spinner after fetch
  }
});

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

async function fetchRandomReviewFromMoviePage(movieUrl) {
  try {
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(movieUrl + 'reviews/by/activity/')}`);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const maxReviewLength = 368;
    const movieName = doc.querySelectorAll('div.contextual-title > h1 > a')[0].innerText.toLowerCase();
    const reviews = Array.from(doc.querySelectorAll('li.film-detail > div.film-detail-content > div > div.body-text:not([hidden])'))
      .map(reviewDiv => reviewDiv.innerText)
      .filter(review=>(review.length<maxReviewLength && !review.toLowerCase().includes(movieName)));

    const review = pickRandom(reviews, 1);

    return review;
  } catch {
    return null;
  }
}

function renderReviews(reviewData) {
  const container = document.getElementById('reviews');
  container.innerHTML = '';
  reviewData.forEach(({ review, url }, i) => {
    const card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML = `<p>${review}</p><button>Pick This One</button>`;
    card.querySelector('button').addEventListener('click', () => {
      window.open(url, '_blank');
    });
    container.appendChild(card);
  });
}
