import React, { useState, useEffect } from "react";
import Calendar from "./Calendar";
import "./index.css";

function App() {
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem("events");
    return saved ? JSON.parse(saved) : {};
  });

  const [popup, setPopup] = useState(null);
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem("seenWelcome");
  });

  // Load static events JSON on mount and merge with saved events
  useEffect(() => {
    fetch("/staticEvents.json")
      .then((res) => res.json())
      .then((staticData) => {
        const formatted = {};
        staticData.forEach((event) => {
          if (!formatted[event.date]) formatted[event.date] = [];
          formatted[event.date].push(event);
        });
        // Merge with local storage events, static events have priority if conflicts
        setEvents((prev) => ({ ...prev, ...formatted }));
      });
  }, []);

  useEffect(() => {
    localStorage.setItem("events", JSON.stringify(events));
  }, [events]);

  const playSound = () => {
    const audio = new Audio("/notify.mp3");
    audio.play().catch((err) => console.error("Sound error:", err));
  };

  const showPopup = (title, time) => {
    setPopup({ title, time });
    playSound();
    setTimeout(() => setPopup(null), 5000);
  };

  // Reminder timers based on startTime or time (if no endTime)
  useEffect(() => {
    const now = new Date();
    const timers = [];

    Object.entries(events).forEach(([dateStr, eventList]) => {
      eventList.forEach((event) => {
        const eventTime = event.startTime || event.time;
        if (!eventTime) return;

        const eventDateTime = new Date(`${dateStr}T${eventTime}`);
        const diff = eventDateTime.getTime() - now.getTime();

        if (diff > 0 && diff < 86400000) {
          const timer = setTimeout(() => {
            showPopup(event.title, eventTime);
          }, diff);
          timers.push(timer);
        }

        // Optional: check every second if the current time matches event time
        const repeatInterval = setInterval(() => {
          const now = new Date();
          const [hr, min] = eventTime.split(":").map(Number);

          if (
            now.getHours() === hr &&
            now.getMinutes() === min &&
            now.getSeconds() === 0
          ) {
            showPopup(event.title, eventTime);
          }
        }, 1000);

        timers.push(repeatInterval);
      });
    });

    return () => timers.forEach(clearInterval);
  }, [events]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 via-purple-100 to-indigo-200 p-8">
      <h1 className="text-4xl font-bold text-center mb-2 text-indigo-800 drop-shadow">
        📅Calendar
      </h1>
      <p className="text-center text-gray-600 mb-6">
        Add events, get reminders, and plan your day!
      </p>

      {showWelcome && (
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded mb-4 text-center shadow">
          <strong>Welcome!</strong> Click any date to add an event. A popup & sound
          reminder will alert you! 🎉
          <button
            className="ml-4 text-sm underline text-blue-800 hover:text-blue-900"
            onClick={() => {
              localStorage.setItem("seenWelcome", "true");
              setShowWelcome(false);
            }}
          >
            Got it
          </button>
        </div>
      )}

      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl p-6 relative">
        <Calendar events={events} setEvents={setEvents} />

        {popup && (
          <div
            className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-xl shadow-lg animate-bounce z-50 cursor-pointer"
            onClick={() => setPopup(null)}
          >
            📌 Reminder: <strong>"{popup.title}"</strong> at {popup.time}
          </div>
        )}
      </div>

      <button
        className="fixed bottom-6 right-6 bg-indigo-700 text-white p-3 rounded-full shadow-2xl text-lg hover:bg-indigo-800"
        onClick={() =>
          alert(
            "📅 How to use:\n\n• Click a date to add an event.\n• At the set time, you’ll get a reminder!"
          )
        }
      >
        ?
      </button>
    </div>
  );
}

export default App;
