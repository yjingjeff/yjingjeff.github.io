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

  let userProfile = {};
  let styles = ["Italian", "French", "English", "Chinese", "Japanese", "Mediterranean",
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
    ///temporary unblock redrawn modal for easy testing
    ///if (!isRequestInProgress) {
      modal.style.display = "block";
    ///}
    ///else { alert('Request already in progress.')}
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
    console.log("Submit Button Pressed: ", aiRequestCompleted);
    /* if (isRequestInProgress) {
      console.log("Request is already in progress.");
    } */

    isRequestInProgress = true; //request start

    if (!aiRequestCompleted) {
      // If AI response is not ready, show spinner and wait for AI response
      showSpinner();
      await waitForAIResponse();
    }

    /*try {
      ///const city = document.getElementById("userLocation").value;
      ///await callBackendWithUpdatedValues(city, finalInputDict);
    } catch (error) {
      console.error("Error during backend call:", error);
    } finally {
      hideSpinner();
      isRequestInProgress = false; // Reset the flag when done
    }*/
  }


  //Called inside Submit button click
  function waitForAIResponse() {
    let attempts = 0;
    return new Promise((resolve) => {
      const checkAICompletion = setInterval(() => {
        attempts++;
        console.log(`Attempt ${attempts}`);
        if (aiRequestCompleted || attempts > 5) { // Let's say after 50 attempts we stop checking
          clearInterval(checkAICompletion);
          resolve();
          if (!aiRequestCompleted) {
            console.log("Max attempts reached without AI completion.");
          }
        }
      }, 200); //200 ms wait time
    });
  }


  // Assuming submitImprovementsBtn is correctly initialized elsewhere
  submitImprovementsBtn.onclick = async function () {
    hideModal();
    console.log("AI request completed: ", aiRequestCompleted);

    // Check if AI response has completed
    if (!aiRequestCompleted) {
      // If AI response is not ready, show spinner and wait for AI response
      const selectedImprovements = getSelectedImprovementsFromModal();
      console.log("here inside submit to call entry");
      console.log(selectedImprovements);

      showSpinner();
      await waitForAIResponse();
    }

    // Hide the modal
    hideModal();

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
      model: document.getElementById("model").value,
    };
  }

  // Toggle button selection and update selectedImprovements object
  // This needs to be here to accept user input on modal
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
    //let selectedImprovements = {};
    // Assuming each button has a class 'improve-btn' and is toggled with 'selected' class upon selection
    document.querySelectorAll('.improve-btn.selected').forEach(btn => {
      const improvement = btn.getAttribute('data-improve');
      userProfile[btn.parentNode.getAttribute("id")] = improvement; // Marking selected improvements as true
    });
    return userProfile;
  }


  document.getElementById("fetchButton").addEventListener("click", async function () {
    /* if (isRequestInProgress){
      alert('Request is already in progress');
      return;
    } */

    aiRequestCompleted = false;
    showModal(); //Immediately show modal
    userProfile = constructUserProfile();
    console.log('fetch button pressed with user profile: ', userProfile);

    isRequestInProgress = true;
    
    // Add a fresh event listener
    submitImprovementsBtn.addEventListener("click", submitImprovementsHandler);
    /*  THIS IS THE ENTRY --- should move to Submit button click event
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
  })
});

// Comments Section Handling
/*
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
*/
