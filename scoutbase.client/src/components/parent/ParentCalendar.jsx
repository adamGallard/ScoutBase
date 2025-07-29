// src/components/parent/ParentCalendar.jsx

import React, { useEffect, useState } from 'react';
import ical from 'ical.js';
import {
    Calendar,
    momentLocalizer,
} from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useSwipeable } from 'react-swipeable';

const localizer = momentLocalizer(moment);

const CATEGORIES = {
    all: { label: 'All', color: '#666' },
    joeys: { label: 'Joeys', color: '#b65518' },
    cubs: { label: 'Cubs', color: '#ffc82e' },
    scouts: { label: 'Scouts', color: '#00ae42' },
    venturers: { label: 'Venturers', color: '#9e1b32' },
    group: { label: 'Group', color: '#00664a' },
};

export default function ParentCalendar({ feedUrl }) {
    const [events, setEvents] = useState([]);
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState('month');  // ← control view
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selectedEvent, setSelectedEvent] = useState(null);

    // 1) Load ICS feed
    useEffect(() => {
        if (!feedUrl) return;
        fetch(feedUrl)
            .then(r => r.text())
            .then(txt => {
                const jcal = ical.parse(txt);
                const comp = new ical.Component(jcal);
                const vevents = comp.getAllSubcomponents('vevent');

                const parsed = vevents.map(evt => {
                    const sum = evt.getFirstPropertyValue('summary');
                    const desc = evt.getFirstPropertyValue('description') || '';
                    const start = evt.getFirstPropertyValue('dtstart').toJSDate();
                    const end = evt.getFirstPropertyValue('dtend').toJSDate();

                    // detect category
                    let cat = 'all';
                    Object.keys(CATEGORIES).forEach(k => {
                        if (
                            k !== 'all' &&
                            desc.includes(`Event owner: Belmont ${CATEGORIES[k].label}`)
                        ) {
                            cat = k;
                        }
                    });

                    const tr = `${moment(start).format('h:mm A')}–${moment(end).format('h:mm A')}`;
                    return {
                        id: evt.getFirstPropertyValue('uid') || sum + start,
                        title: `${sum} (${tr})`,
                        start, end, allDay: false,
                        rawSummary: sum,
                        description: desc,
                        category: cat,
                        color: CATEGORIES[cat].color,
                        textColor: cat === 'cubs' ? 'black' : 'white',
                    };
                });
                setEvents(parsed);
            })
            .catch(console.error);
    }, [feedUrl]);

    // 2) Style events
    const eventStyleGetter = ev => ({
        style: {
            backgroundColor: ev.color,
            color: ev.textColor,
            borderRadius: '5px',
            opacity: 0.85,
            border: 'none',
            padding: '2px 4px',
        }
    });

    // 3) Filter by category
    const filtered = categoryFilter === 'all'
        ? events
        : events.filter(e => e.category === categoryFilter);

    function changeMonth(offset) {
        setDate(prev => {
            const m = moment(prev).add(offset, 'months');
            return m.toDate();
        });
    }

    // Set up swipe handlers
    const handlers = useSwipeable({
        onSwipedLeft: () => changeMonth(1),
        onSwipedRight: () => changeMonth(-1),
        delta: 30, // Minimum distance(px) for a swipe
        trackMouse: true // allows desktop drag
    });


    return (
        <>
            {/* Legend & Filter */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {Object.entries(CATEGORIES).map(([key, { label, color }]) => (
                    <div
                        key={key}
                        onClick={() => setCategoryFilter(key)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            cursor: 'pointer',
                            opacity: categoryFilter === key ? 1 : 0.6,
                        }}
                    >
                        <div style={{
                            width: 16,
                            height: 16,
                            backgroundColor: color,
                            borderRadius: 3,
                            border: categoryFilter === key
                                ? '2px solid #333'
                                : '1px solid #ccc',
                        }} />
                        <span style={{ fontSize: '0.9rem' }}>{label}</span>
                    </div>
                ))}
            </div>

            {/* Calendar with working Month/Agenda toggle */}
            <div style={{ height: 600 }} {...handlers}>
                <Calendar
                    localizer={localizer}
                    events={filtered}
                    startAccessor="start"
                    endAccessor="end"
                    eventPropGetter={eventStyleGetter}
                    views={['month', 'agenda']}
                    defaultView="month"
                    date={date}
                    onNavigate={setDate}
                    view={view}
                    onView={setView}
                    onSelectEvent={setSelectedEvent}
                    style={{ height: '100%' }}
                />
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.95rem', color: '#888', margin: '0.5rem 0' }}>
                Swipe left or right to change months
            </div>

            {/* Event Details Modal */}
            {selectedEvent && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setSelectedEvent(null)}
                >
                    <div
                        style={{
                            background: '#fff',
                            padding: '1.5rem',
                            borderRadius: 8,
                            maxWidth: '90%',
                            width: 400,
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h2>{selectedEvent.rawSummary}</h2>
                        <p>
                            <strong>When:</strong><br />
                            {new Date(selectedEvent.start).toLocaleString('en-AU', {
                                weekday: 'short', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })} –<br />
                            {new Date(selectedEvent.end).toLocaleTimeString('en-AU', {
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, marginTop: '0.5rem' }}>
                            {selectedEvent.description}
                        </div>
                        <button
                            style={{
                                marginTop: '1rem',
                                padding: '0.5rem 1rem',
                                backgroundColor: '#0F5BA4',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer'
                            }}
                            onClick={() => setSelectedEvent(null)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
