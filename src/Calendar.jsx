import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Utility to convert "HH:mm" to minutes since midnight
const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

// Check if two events overlap
const isOverlapping = (ev1, ev2) => {
  const start1 = timeToMinutes(ev1.startTime || ev1.time);
  const end1 = timeToMinutes(ev1.endTime || ev1.time);
  const start2 = timeToMinutes(ev2.startTime || ev2.time);
  const end2 = timeToMinutes(ev2.endTime || ev2.time);

  return start1 < end2 && start2 < end1;
};

function Calendar({ events, setEvents }) {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(null);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  const eventPanelRef = useRef(null);

  useEffect(() => {
    setTitle("");
    setTime("");
    setEndTime("");
    setColor("#6366f1");
    setIsAddingEvent(true);
  }, [selectedDate]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        eventPanelRef.current &&
        !eventPanelRef.current.contains(event.target) &&
        !event.target.classList.contains("date-box")
      ) {
        setIsAddingEvent(false);
        setSelectedDate(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const startOfMonth = currentDate.startOf("month");
  const startDayOfWeek = startOfMonth.day();
  const daysInMonth = currentDate.daysInMonth();

  const days = [];
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(dayjs(currentDate).date(i));
  }

  const selectedDateStr = selectedDate?.format("YYYY-MM-DD");

  // Check conflicts with existing events on the selected date
  const hasConflict = (newStart, newEnd) => {
    if (!selectedDateStr || !events[selectedDateStr]) return false;
    return events[selectedDateStr].some((ev) =>
      isOverlapping(
        { startTime: newStart, endTime: newEnd },
        { startTime: ev.startTime || ev.time, endTime: ev.endTime || ev.time }
      )
    );
  };

  const handleAddEvent = () => {
    if (!title || !time) return alert("Please enter event title and start time");
    if (endTime && timeToMinutes(endTime) <= timeToMinutes(time))
      return alert("End time must be after start time");

    if (hasConflict(time, endTime || time)) {
      if (
        !window.confirm(
          "This event overlaps with an existing event. Add anyway?"
        )
      )
        return;
    }

    const newEvents = { ...events };
    if (!newEvents[selectedDateStr]) newEvents[selectedDateStr] = [];
    newEvents[selectedDateStr].push({ title, startTime: time, endTime, color });
    setEvents(newEvents);

    setTitle("");
    setTime("");
    setEndTime("");
    setColor("#6366f1");
    setIsAddingEvent(false);
    setSelectedDate(null);
  };

  const handleDeleteEvent = (index) => {
    const newEvents = { ...events };
    newEvents[selectedDateStr].splice(index, 1);
    if (newEvents[selectedDateStr].length === 0) {
      delete newEvents[selectedDateStr];
    }
    setEvents(newEvents);
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex justify-between mb-4 items-center">
        <button
          onClick={() => setCurrentDate(currentDate.subtract(1, "month"))}
          className="px-3 py-1 rounded-full bg-indigo-200 hover:bg-indigo-300 shadow"
        >
          ◀
        </button>
        <h2 className="text-xl font-semibold text-indigo-700">
          {currentDate.format("MMMM YYYY")}
        </h2>
        <button
          onClick={() => setCurrentDate(currentDate.add(1, "month"))}
          className="px-3 py-1 rounded-full bg-indigo-200 hover:bg-indigo-300 shadow"
        >
          ▶
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center font-semibold text-gray-700 mb-2">
        {weekdays.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {[...Array(startDayOfWeek)].map((_, i) => (
          <div key={"empty-" + i} />
        ))}

        {days.map((d) => {
          const dateStr = d.format("YYYY-MM-DD");
          const isToday = d.isSame(dayjs(), "day");
          const isSelected = selectedDateStr === dateStr;
          const hasEvents = events[dateStr]?.length > 0;

          // Prepare event blocks with conflict detection
          const dayEvents = events[dateStr] || [];

          // For overlap display, mark each event with conflict flag
          const conflictFlags = dayEvents.map((ev, i) => {
            return dayEvents.some(
              (otherEv, j) => i !== j && isOverlapping(ev, otherEv)
            );
          });

          return (
            <div
              key={dateStr}
              onClick={() => setSelectedDate(d)}
              className={`date-box cursor-pointer rounded-lg border flex flex-col justify-between items-center
                ${isToday ? "bg-yellow-200 font-bold" : "bg-white"}
                ${isSelected ? "border-indigo-600 shadow-xl" : "border-gray-300"}
                hover:bg-indigo-100 hover:scale-105 transition-transform duration-200 ease-in-out p-2`}
              style={{ aspectRatio: "1 / 1", minHeight: "70px" }}
              title={
                hasEvents
                  ? dayEvents.map((e) => e.title).join(", ")
                  : ""
              }
            >
              <div>{d.date()}</div>

              {/* Event blocks: color coded with conflict highlight */}
              <div className="flex flex-col gap-1 w-full mt-1 overflow-hidden">
                {dayEvents.map((e, i) => (
                  <div
                    key={i}
                    title={`${e.title} (${e.startTime} - ${e.endTime || e.startTime})`}
                    className={`w-full h-2 rounded ${
                      conflictFlags[i] ? "ring-2 ring-red-500" : ""
                    }`}
                    style={{ backgroundColor: e.color || "#6366f1" }}
                  />
                ))}
              </div>

              {/* Number of events badge */}
              {hasEvents && (
                <div className="mt-1 text-xs text-blue-600 font-semibold">
                  📌 {dayEvents.length}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isAddingEvent && selectedDate && (
        <div
          ref={eventPanelRef}
          className="mt-6 bg-indigo-50 p-4 rounded-xl shadow-lg animate-fadeIn"
        >
          <h3 className="font-semibold text-indigo-800 mb-3">
            Events on {selectedDate.format("MMM D, YYYY")}
          </h3>

          {events[selectedDateStr]?.length ? (
            <ul
              className="mb-4 space-y-2 overflow-y-auto"
              style={{ maxHeight: "140px" }}
            >
              {events[selectedDateStr].map((event, idx) => (
                <li
                  key={idx}
                  className="p-2 rounded flex justify-between items-center"
                  style={{
                    borderLeft: `5px solid ${event.color || "#6366f1"}`,
                    backgroundColor: "#e0e7ff",
                  }}
                >
                  <div>
                    <strong>{event.startTime || event.time}</strong>
                    {event.endTime ? ` - ${event.endTime}` : ""} - {event.title}
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(idx)}
                    className="text-red-600 hover:text-red-800 font-bold"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 text-gray-500">No events yet</p>
          )}

          <input
            type="text"
            className="border p-2 rounded w-full mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <div className="flex gap-2 mb-2">
            <input
              type="time"
              className="border p-2 rounded w-1/2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Start Time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
            <input
              type="time"
              className="border p-2 rounded w-1/2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="End Time (optional)"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              min={time}
            />
          </div>

          <input
            type="color"
            className="mb-4 w-full h-8 cursor-pointer"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />

          <button
            onClick={handleAddEvent}
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
          >
            Add Event
          </button>
        </div>
      )}
    </div>
  );
}

export default Calendar;
