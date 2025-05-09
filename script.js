document.addEventListener("DOMContentLoaded", () => {
  // Set the current year in the footer
  document.getElementById("current-year").textContent =
    new Date().getFullYear();

  // Fetch GitHub commits
  fetchGitHubCommits();
});

/**
 * Fetches the most recent commits from the GitHub user's repositories
 * and displays them on the page
 */
async function fetchGitHubCommits() {
  const username = "xgenem";
  const commitsContainer = document.getElementById("commits-container");

  try {
    // First get user repositories
    const reposResponse = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&direction=desc&per_page=5`
    );

    if (!reposResponse.ok) {
      throw new Error(`GitHub API Error: ${reposResponse.status}`);
    }

    const repos = await reposResponse.json();

    if (repos.length === 0) {
      displayNoCommitsMessage();
      return;
    }

    // For each repo, fetch the latest commits
    const commitPromises = repos.map((repo) =>
      fetch(
        `https://api.github.com/repos/${username}/${repo.name}/commits?per_page=3`
      )
        .then((response) => {
          if (!response.ok && response.status !== 404) {
            throw new Error(`GitHub API Error: ${response.status}`);
          }
          return response.ok ? response.json() : [];
        })
        .then((commits) => ({
          repo: repo.name,
          repoUrl: repo.html_url,
          commits: commits,
        }))
    );

    const repoCommits = await Promise.all(commitPromises);
    displayCommits(repoCommits);
  } catch (error) {
    displayErrorMessage(error);
  }
}

/**
 * Displays the fetched commits on the page
 * @param {Array} repoCommits - Array of repo objects with their commits
 */
function displayCommits(repoCommits) {
  const commitsContainer = document.getElementById("commits-container");

  // Clear loading elements
  commitsContainer.innerHTML = "";

  let hasAnyCommits = false;

  repoCommits.forEach((repoData) => {
    if (repoData.commits.length > 0) {
      hasAnyCommits = true;

      // Create repository section
      const repoSection = document.createElement("div");
      repoSection.className = "repo-section";

      // Add repo name header
      const repoHeader = document.createElement("h3");
      repoHeader.textContent = repoData.repo;
      repoHeader.style.marginTop = "1.5rem";
      repoHeader.style.marginBottom = "1rem";

      const repoLink = document.createElement("a");
      repoLink.href = repoData.repoUrl;
      repoLink.textContent = `View Repository`;
      repoLink.className = "commit-link";
      repoLink.style.marginLeft = "10px";
      repoLink.style.fontSize = "0.9rem";
      repoHeader.appendChild(repoLink);

      repoSection.appendChild(repoHeader);

      // Add each commit
      repoData.commits.forEach((commit) => {
        const commitItem = createCommitElement(commit, repoData.repo);
        repoSection.appendChild(commitItem);
      });

      commitsContainer.appendChild(repoSection);
    }
  });

  if (!hasAnyCommits) {
    displayNoCommitsMessage();
  }
}

/**
 * Creates a DOM element for a commit
 * @param {Object} commit - The commit data
 * @param {String} repoName - The repository name
 * @returns {HTMLElement} The created commit element
 */
function createCommitElement(commit, repoName) {
  const commitItem = document.createElement("div");
  commitItem.className = "commit-item";

  // Commit message
  const commitTitle = document.createElement("div");
  commitTitle.className = "commit-title";
  commitTitle.textContent = commit.commit.message.split("\n")[0]; // Get first line of commit message
  commitItem.appendChild(commitTitle);

  // Commit metadata
  const commitMeta = document.createElement("div");
  commitMeta.className = "commit-meta";

  // Author and date
  const authorInfo = document.createElement("span");
  const authorName = commit.commit.author.name;
  const date = new Date(commit.commit.author.date);
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  authorInfo.textContent = `${authorName} • ${formattedDate}`;
  commitMeta.appendChild(authorInfo);

  // Link to commit
  const commitLink = document.createElement("a");
  commitLink.href = commit.html_url;
  commitLink.textContent = "View Commit";
  commitLink.className = "commit-link";
  commitLink.target = "_blank";
  commitMeta.appendChild(commitLink);

  commitItem.appendChild(commitMeta);
  return commitItem;
}

/**
 * Displays a message when no commits are found
 */
function displayNoCommitsMessage() {
  const commitsContainer = document.getElementById("commits-container");
  commitsContainer.innerHTML = `
    <p style="text-align: center; padding: 2rem;">
      No commits found. You might need to create some repositories with commits.
    </p>
  `;
}

/**
 * Displays an error message if fetching commits fails
 * @param {Error} error - The error that occurred
 */
function displayErrorMessage(error) {
  console.error("Error fetching GitHub data:", error);
  const commitsContainer = document.getElementById("commits-container");
  commitsContainer.innerHTML = `
    <p style="text-align: center; color: #dc3545; padding: 2rem;">
      Error loading GitHub data. This might be due to API rate limits.
      Please try again later.
    </p>
  `;
}
