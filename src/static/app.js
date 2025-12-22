document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Example activities now include participants
  const activities = [
    {
      id: 1,
      title: 'Kayaking Trip',
      description: 'Join us for a scenic kayak on the lake.',
      participants: ['Alice Johnson', 'Sam Lee', 'Ravi Patel']
    },
    {
      id: 2,
      title: 'Trail Run',
      description: '5k trail run through the hills.',
      participants: []
    }
    // ...existing activities...
  ];

  // Helper: render participants block for a single card (avoids duplicating full participants.js)
  function renderParticipantsForCard(card, participants = []) {
    if (card.querySelector('.participants')) return;
    const container = document.createElement('div');
    container.className = 'participants';
    const title = document.createElement('h5');
    title.textContent = 'Participants';
    container.appendChild(title);

    if (!participants || participants.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'participants-empty';
      empty.textContent = 'No participants yet.';
      container.appendChild(empty);
    } else {
      const list = document.createElement('ul');
      list.className = 'participants-list';
      participants.forEach(name => {
        const li = document.createElement('li');
        li.className = 'participant';
        const avatar = document.createElement('span');
        avatar.className = 'participant-avatar';
        avatar.textContent = (name || '').split(/\s+/).slice(0,2).map(n=>n[0]?.toUpperCase()).join('');
        const pname = document.createElement('span');
        pname.className = 'participant-name';
        pname.textContent = name;
        li.appendChild(avatar);
        li.appendChild(pname);
        list.appendChild(li);
      });
      container.appendChild(list);
    }

    card.appendChild(container);
  }

  // Render activities (ensure data-participants is present and participants are displayed)
  function renderActivities() {
    const container = document.getElementById('activities');
    // ...existing code to clear container...
    container.innerHTML = ''; // simple reset (replace with existing logic if different)

    activities.forEach(activity => {
      const card = document.createElement('div');
      card.className = 'activity-card';
      card.setAttribute('data-activity-id', activity.id);
      // expose participants for participants.js or for debugging
      card.setAttribute('data-participants', JSON.stringify(activity.participants || []));
      // ...existing code that adds title/description...
      const h4 = document.createElement('h4');
      h4.textContent = activity.title;
      const p = document.createElement('p');
      p.textContent = activity.description;
      card.appendChild(h4);
      card.appendChild(p);

      // render participants block right away so dynamically-added cards show participants
      renderParticipantsForCard(card, activity.participants || []);

      container.appendChild(card);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle adding a new activity and parsing participants from an optional input
  const form = document.getElementById('new-activity-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // ...existing code to read title/description...
      const titleInput = form.querySelector('[name="title"], #title');
      const descInput = form.querySelector('[name="description"], #description');
      const participantsInput = form.querySelector('[name="participants"], #participants');

      const title = titleInput ? titleInput.value.trim() : 'Untitled';
      const description = descInput ? descInput.value.trim() : '';
      let participants = [];
      if (participantsInput && participantsInput.value) {
        participants = participantsInput.value.split(',').map(s => s.trim()).filter(Boolean);
      }

      const newActivity = {
        id: Date.now(),
        title,
        description,
        participants
      };
      activities.push(newActivity);
      renderActivities();

      // ...existing code to reset form / show message...
      form.reset();
    });
  }

  // Initialize app
  fetchActivities();

  // initial render
  renderActivities();
});
