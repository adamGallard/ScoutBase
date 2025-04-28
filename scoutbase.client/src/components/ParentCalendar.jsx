import React, { useEffect, useState } from 'react';
import ical from 'ical.js';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

export default function ParentCalendar({ feedUrl }) {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        if (!feedUrl) return;
        fetch(feedUrl)
            .then(res => res.text())
            .then(text => {
                const jcal = ical.parse(text);
                const comp = new ical.Component(jcal);
                const vevents = comp.getAllSubcomponents('vevent');

                const parsed = vevents.map(evt => {
                    const summary = evt.getFirstPropertyValue('summary');
                    const description = evt.getFirstPropertyValue('description') || '';
                    const dtstart = evt.getFirstPropertyValue('dtstart').toJSDate();
                    const dtend = evt.getFirstPropertyValue('dtend').toJSDate();

                    // determine category from description
                    let category = 'default';
                    ['Joeys', 'Cubs', 'Scouts', 'Venturers'].forEach(sec => {
                        if (description.includes(`Event owner: Belmont ${sec}`)) {
                            category = sec.toLowerCase();
                        }
                    });

                    // map your group colors
                    const colors = {
                        joeys: '#b65518',
                        cubs: '#ffc82e',
                        scouts: '#00ae42',
                        venturers: '#9e1b32',
                        default: '#00664a',
                    };

                    return {
                        title: `${summary} (${moment(dtstart).format('h:mm A')} – ${moment(dtend).format('h:mm A')})`,
                        start: dtstart,
                        end: dtend,
                        allDay: false,
                        color: colors[category] || colors.default,
                        textColor: category === 'cubs' ? 'black' : 'white',
                        description,
                    };
                });

                setEvents(parsed);
            })
            .catch(console.error);
    }, [feedUrl]);

    const eventStyleGetter = event => ({
        style: {
            backgroundColor: event.color,
            color: event.textColor,
            borderRadius: '5px',
            opacity: 0.85,
            padding: '4px',
            border: 0,
        }
    });

    return (
        <div style={{ height: 600 }}>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                eventPropGetter={eventStyleGetter}
                views={['month']}
                defaultView="month"
            />
        </div>
    );
}
