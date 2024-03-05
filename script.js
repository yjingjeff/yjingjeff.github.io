//Currenlty, the system is subject to API key abuse if modal is opened and closed rapidly
//If Request is called, then request stops, AI still responds

document.addEventListener("DOMContentLoaded", function () {

  const modal = document.getElementById("improvementModal");
  const btns = document.querySelectorAll(".improve-btn");
  const close = document.querySelector(".close");
  const submitImprovementsBtn = document.getElementById("submitImprovements");
  let selectedImprovements = {};
  modal.style.display = 'none';
  let aiResponseData = null;
  let aiRequestCompleted = false;
  let isRequestInProgress = false; //flag for API abuse prevention

  let styles = ["Italian", "French", "English", "Chinese", "Japanese",
  "Modern", "Contemporary", "Classic", "Rustic", "Oriental", "Boheimain"];

  var select = document.getElementById("style")

  for (var i = 0; i < styles.length; i++) {
            let opt = styles[i];
            let el = document.createElement("option");
            el.text = opt;
            el.value = opt;
            select.add(el);
  }

  function showModal() {
    if (!isRequestInProgress) {
      modal.style.display = "block";
    }
    else { alert('Request already in progress.')}
  }

  function hideModal() {
    modal.style.animation = 'modalExit 0.3s ease-out forwards';
    setTimeout(() => {
      modal.style.display = 'none';
      modal.style.animation = 'none'; // Reset animation
    }, 300); // Match the timeout with animation duration
  }

  close.onclick = function () {
    hideModal();
  };

  window.onclick = function (event) {
    if (event.target == modal) {
      hideModal();
    }
  };

  function showSpinner() {
    document.getElementById("loadingSpinner").style.display = "flex";
    document.getElementById("contentToBlur").classList.add("content-blur");
  }

  function hideSpinner() {
    // Hide spinner and remove blur
    document.getElementById("loadingSpinner").style.display = "none";
    document.getElementById("contentToBlur").classList.remove("content-blur");
  }

  async function submitImprovementsHandler() {
    console.log("AI request completed: ", aiRequestCompleted);
    if (isRequestInProgress) {
      console.log("Request is already in progress.");
      return; // Exit if a request is already in progress
    }

    isRequestInProgress = true; //request start

    if (!aiRequestCompleted) {
      // If AI response is not ready, show spinner and wait for AI response
      showSpinner();
      await waitForAIResponse();
    }
    // At this point, AI response is guaranteed to have completed
    const selectedImprovements = getSelectedImprovementsFromModal();
    const finalInputDict = combineAIResponseAndUserSelections(aiResponseData, selectedImprovements);


    try {
      const city = document.getElementById("userLocation").value;
      await callBackendWithUpdatedValues(city, finalInputDict);
    } catch (error) {
      console.error("Error during backend call:", error);
    } finally {
      hideSpinner();
      isRequestInProgress = false; // Reset the flag when done
    }
  }

  function waitForAIResponse() {
    let attempts = 0;
    return new Promise((resolve) => {
      const checkAICompletion = setInterval(() => {
        attempts++;
        console.log(`Attempt ${attempts}`);
        if (aiRequestCompleted || attempts > 50) { // Let's say after 50 attempts we stop checking
          clearInterval(checkAICompletion);
          resolve();
          if (!aiRequestCompleted) {
            console.log("Max attempts reached without AI completion.");
          }
        }
      }, 200); //200 ms wait time
    });
  }

  function prepareSubmitImprovementsButton() {
    // Remove any existing event listeners to prevent stacking
    submitImprovementsBtn.removeEventListener("click", submitImprovementsHandler);

    // Add a fresh event listener
    submitImprovementsBtn.addEventListener("click", submitImprovementsHandler);
  }

  // Assuming submitImprovementsBtn is correctly initialized elsewhere
  submitImprovementsBtn.onclick = async function () {
    hideModal();
    console.log("AI request completed: ", aiRequestCompleted);

    // Check if AI response has completed
    if (!aiRequestCompleted) {
      // If AI response is not ready, show spinner and wait for AI response
      showSpinner();
      await waitForAIResponse();
    }

    // At this point, AI response is guaranteed to have completed
    // Process selected improvements and AI response
    const selectedImprovements = getSelectedImprovementsFromModal();
    const finalInputDict = combineAIResponseAndUserSelections(aiResponseData, selectedImprovements);

    // Hide the modal
    hideModal();

    // Once the final input is ready, proceed with backend call
    const city = document.getElementById("userLocation").value; // Grab city
    await callBackendWithUpdatedValues(city, finalInputDict);

    // At this point, callBackendWithUpdatedValues has completed, and you can now use aiResponseData
// if (aiResponseData && aiResponseData.Comments) {
//   displayAIComments(aiResponseData.Comments);
// } else {
//   console.error('No comments to display or comments are not in array format', aiResponseData.Comments);
// }

    // Hide spinner once the backend call is initiated or completed based on your app flow
    hideSpinner();
  };

  //Constructing a profile based on html inputs:
  function constructUserProfile() {
    return {
      width: document.getElementById("width").value,
      depth: document.getElementById("depth").value,
      address: document.getElementById("address").value,
      city: document.getElementById("city").value,
      style: document.getElementById("style").value,
    };
  }

  async function callBackendWithUpdatedValues(city, inputDict) {
    console.log("Calling backend with: ", JSON.stringify({ city, input_dict: inputDict }));
    try {
      const response = await fetch("http://localhost:3000/runBackend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, input_dict: inputDict }),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      console.log("Backend response: ", data);
      // Update UI with backend response
      updateUIWithProducts(data);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  // Toggle button selection and update selectedImprovements object
  btns.forEach(btn => {
    btn.onclick = function () {
      const improvement = this.getAttribute("data-improve");
      this.classList.toggle("selected");
      if (selectedImprovements[improvement]) {
        delete selectedImprovements[improvement];
      } else {
        selectedImprovements[improvement] = true;
      }
    };
  });

  //AI Function Call Promise: Currently AI being hit multiple times
  function callAIEndpoint(userProfile) {
    return new Promise((resolve, reject) => {
      fetch("http://localhost:3000/ai-output", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userProfile),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          console.log('callAIEndpoint: ', response, response.Comments);
          //callAIEndpoint(response.Comments);
          //return response.json();
        })
        .then(data => {
          resolve(data); // Resolve the promise with the data from the response
        })
        .catch(error => {
          console.error("Error in AI request:", error);
          reject(error); // Reject the promise if there's an error
        });
    });
  }

  // Function to get selected improvements from modal
  function getSelectedImprovementsFromModal() {
    let selectedImprovements = {};
    // Assuming each button has a class 'improve-btn' and is toggled with 'selected' class upon selection
    document.querySelectorAll('.improve-btn.selected').forEach(btn => {
      const improvement = btn.getAttribute('data-improve');
      selectedImprovements[improvement] = true; // Marking selected improvements as true
    });
    return selectedImprovements;
  }

  function combineAIResponseAndUserSelections(aiData, selectedImprovements) {
    const updatedScores = { ...aiData }; // Create a copy to avoid mutating the original response

    // Increase scores by 3 for selected improvements, up to a max of 10
    Object.keys(selectedImprovements).forEach(key => {
      if (updatedScores[key] !== undefined && selectedImprovements[key]) {
        updatedScores[key] = Math.min(10, updatedScores[key] + 3);
      }
    });

    return updatedScores;
  }

  function updateProductContainer(location, age, products) {
    const productContainer = document.getElementById("productContainer");
    productContainer.innerHTML = ""; // Clear existing content

    if (location && age) {
      // Displaying user-specific message
      const info = document.createElement("div");
      info.textContent = `Showing products for ${age} years old in ${location}`;
      info.className = "info-text";
      productContainer.appendChild(info);

      /* ROUTE HERE TO GPT MODEL
              EXTERNAL CODE RUNS, RETURNS
          GPT RETURN */
      const resultingProducts = [location, age]; //REPLACE WITH RETURN FROM GPT FUNCTION
      arrangeProducts(resultingProducts);
    }

    //Product Creation
    // **TO BE REPLACED BY SHOPIFY LIQUID ELEMENTS FOR ITEM DISPLAY
    products.forEach((product) => {
      const productTile = document.createElement("div");
      productTile.className = "product-tile";
      productTile.textContent = product;
      productContainer.appendChild(productTile);
    });
  }

  function arrangeProducts(products) {
    const productContainer = document.getElementById("productContainer");
    productContainer.innerHTML = ""; // Clear existing content

    products.forEach((productArray) => {
      const productTile = document.createElement("div");
      productTile.className = "product-tile";

      const productName = document.createElement("h3");
      productName.textContent = productArray[0]; // Product name is the first element
      productTile.appendChild(productName);

      const score = document.createElement("p");
      score.textContent = `Score: ${productArray[1]}`; // Score is the second element
      productTile.appendChild(score);

      productContainer.appendChild(productTile);
    });
  }

  function createStatBar(statName, statValue) {
    const statContainer = document.createElement("div");
    statContainer.className = "stat-container";

    const statLabel = document.createElement("span");
    statLabel.textContent = statName + ": ";
    statContainer.appendChild(statLabel);

    const statBarOuter = document.createElement("div");
    statBarOuter.className = "stat-bar-outer";

    const statBar = document.createElement("div");
    statBar.className = "stat-bar";
    statBarOuter.appendChild(statBar);
    statContainer.appendChild(statBarOuter);

    requestAnimationFrame(() => {
      statBar.style.setProperty('--target-width', `${(statValue / 10) * 100}%`);
      statBar.classList.add('animate-grow'); // Add class to start the animation
    });

    return statContainer;
  }

  function updateUIWithProducts(backendResponse) {
    const productContainer = document.getElementById("productContainer");
    productContainer.innerHTML = ""; // Clear existing content

    backendResponse.forEach(product => {
      const productTile = document.createElement("div");
      productTile.className = "product-tile";

      const productName = document.createElement("h3");
      productName.textContent = product.name; // Access product name
      productTile.appendChild(productName);

      // Convert score to stars
      const scoreToStars = convertScoreToStars(product.score);
      const stars = document.createElement("p");
      stars.innerHTML = scoreToStars; // Display stars as innerHTML
      productTile.appendChild(stars);

      // Display top 5 stats
      const statsList = Object.entries(product.stats)
        .sort(([, a], [, b]) => b - a) // Sort stats by value, descending
        .slice(0, 5); // Take top 5

      statsList.forEach(([statName, statValue]) => {
        const statBar = createStatBar(statName, statValue);
        productTile.appendChild(statBar);
      });

      productContainer.appendChild(productTile);
    });
  }

  // Converts a score to a star rating (HTML string)
  function convertScoreToStars(score) {
    let stars = '';
    if (score > 250) {
      stars = '⭐'; // 1 star for scores above 250
    } else if (score > 150) {
      stars = '⭐⭐'; // 2 stars for scores above 150
    } else if (score > 100) {
      stars = '⭐⭐⭐'; // 3 stars for scores above 100
    } else if (score > 50) {
      stars = '⭐⭐⭐⭐'; // 4 stars for scores above 50
    } else {
      stars = '⭐⭐⭐⭐⭐'; // 5 stars for scores 50 or below
    }
    // Implement half-stars if necessary by checking specific ranges and adjusting the string accordingly
    return stars;
  }

  document.getElementById("fetchButton").addEventListener("click", async function () {
    if (isRequestInProgress){
      alert('Request is already in progress');
      return;
    }

    aiRequestCompleted = false;
    showModal(); //Immediately show modal
    const userProfile = constructUserProfile();
    console.log('fetch button pressed with user profile: ', userProfile);

    isRequestInProgress = true;
    /*
    try {
      console.log("AI call Initiated, AIReqCompleted = ", aiRequestCompleted);
      const data = await callAIEndpoint(userProfile);
      //aiResponseData = JSON.parse(data);
      aiRequestCompleted = true;
      console.log('AI successful, data returned: ', aiResponseData);
    } catch (error) {
      console.error('AI request failed: ', error);
    } finally{
      isRequestInProgress=false;
    } */
    prepareSubmitImprovementsButton(); //Reset event listeners
  })
});

// Comments Section Handling

// Function to display AI comments
function displayAIComments(comments) {
  const commentsList = document.getElementById("commentsList");
  // Clear any existing comments
  commentsList.innerHTML = '';

  // Iterate over each comment and create the necessary HTML
  comments.forEach(comment => {
    // Create comment item container
    const commentItem = document.createElement("li");
    commentItem.className = "comment-item";

    // Create paragraph for the comment text
    const commentText = document.createElement("p");
    commentText.className = "comment-text";
    commentText.textContent = comment.reasoning;

    // Create paragraph for the comment author
    const commentAuthor = document.createElement("p");
    commentAuthor.className = "comment-author";
    commentAuthor.textContent = comment.point;

    // Append text and author to comment item
    commentItem.appendChild(commentText);
    commentItem.appendChild(commentAuthor);

    // Append comment item to list
    commentsList.appendChild(commentItem);
  });
}

// Example usage:
displayAIComments([
  { text: 'This is an insightful comment from Supple.', author: 'Supple AI' },
  { text: 'Another piece of wisdom.', author: 'Supple AI' }
]);
