import { useState } from 'react';

const CATEGORIES = ['filing', 'hearing', 'deposition', 'contract', 'correspondence', 'other'];

export default function FilterBar({ onFilterChange }) {
    const [activeCategories, setActiveCategories] = useState([]);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [search, setSearch] = useState('');

    const applyFilters = (overrides = {}) => {
        const cats = overrides.categories ?? activeCategories;
        const f = overrides.from ?? from;
        const t = overrides.to ?? to;
        const s = overrides.search ?? search;

        onFilterChange({
            category: cats.length === 1 ? cats[0] : undefined,
            from: f || undefined,
            to: t || undefined,
            search: s || undefined,
        });
    };

    const toggleCategory = (cat) => {
        const updated = activeCategories.includes(cat)
            ? activeCategories.filter((c) => c !== cat)
            : [...activeCategories, cat];
        setActiveCategories(updated);
        applyFilters({ categories: updated });
    };

    const handleReset = () => {
        setActiveCategories([]);
        setFrom('');
        setTo('');
        setSearch('');
        onFilterChange({});
    };

    return (
        <div className="filter-bar">
            <div className="filter-group">
                <label>Search</label>
                <input
                    className="input"
                    style={{ width: '200px' }}
                    placeholder="Search events..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); applyFilters({ search: e.target.value }); }}
                />
            </div>

            <div className="filter-group">
                <label>From</label>
                <input
                    type="date"
                    className="input"
                    style={{ width: '150px' }}
                    value={from}
                    onChange={(e) => { setFrom(e.target.value); applyFilters({ from: e.target.value }); }}
                />
            </div>

            <div className="filter-group">
                <label>To</label>
                <input
                    type="date"
                    className="input"
                    style={{ width: '150px' }}
                    value={to}
                    onChange={(e) => { setTo(e.target.value); applyFilters({ to: e.target.value }); }}
                />
            </div>

            <div className="filter-categories">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        className={`filter-chip ${activeCategories.includes(cat) ? 'active' : ''}`}
                        onClick={() => toggleCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {(activeCategories.length > 0 || from || to || search) && (
                <button className="btn btn-ghost btn-sm" onClick={handleReset}>
                    ✕ Reset
                </button>
            )}
        </div>
    );
}
