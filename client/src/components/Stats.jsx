// Highest / lowest / average / count, or a friendly empty state.
export default function Stats({ stats, emptyText }) {
  if (stats.count === 0) {
    return <p className="empty">{emptyText}</p>;
  }

  const items = [
    { label: 'Highest', value: stats.highest, unit: 'mg/dl' },
    { label: 'Lowest', value: stats.lowest, unit: 'mg/dl' },
    { label: 'Average', value: stats.average.toFixed(1), unit: 'mg/dl' },
    { label: 'Readings', value: stats.count },
  ];

  return (
    <dl className="stats">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>
            {item.value}
            {item.unit && <small>{item.unit}</small>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
