import { useEffect, useRef } from 'react';
import { Timeline as VisTimeline } from 'vis-timeline/standalone';
import { DataSet } from 'vis-data/standalone';

export default function Timeline({ items, onSelect }) {
    const containerRef = useRef(null);
    const timelineRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current || items.length === 0) return;

        const dataset = new DataSet(items);

        const options = {
            width: '100%',
            height: '380px',
            margin: { item: 12 },
            orientation: 'top',
            showCurrentTime: false,
            zoomMin: 1000 * 60 * 60 * 24, // 1 day
            zoomMax: 1000 * 60 * 60 * 24 * 365 * 50, // 50 years
            stack: true,
            verticalScroll: true,
            tooltip: {
                followMouse: true,
                overflowMethod: 'flip',
            },
            template: (item) => {
                return `<span style="font-size: 11px; font-weight: 500;">${item.content}</span>`;
            },
        };

        // Destroy previous instance
        if (timelineRef.current) {
            timelineRef.current.destroy();
        }

        const timeline = new VisTimeline(containerRef.current, dataset, options);

        timeline.on('select', (properties) => {
            if (properties.items.length > 0) {
                onSelect && onSelect(properties.items[0]);
            }
        });

        // Fit all items with some padding
        timeline.fit({ animation: { duration: 500 } });

        timelineRef.current = timeline;

        return () => {
            if (timelineRef.current) {
                timelineRef.current.destroy();
                timelineRef.current = null;
            }
        };
    }, [items, onSelect]);

    return <div ref={containerRef} style={{ minHeight: '380px' }} />;
}
