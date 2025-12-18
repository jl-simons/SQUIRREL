import React from 'react';

/**
 * LineChart Component
 *
 * Retro-styled SVG line chart with 90s/2000s aesthetic.
 * Features: grid background, drop shadows, bold lines, data points, legend
 *
 * @param {Array} series - Array of series objects: [{ name: string, data: [{ x: string, y: number }] }]
 * @param {number} width - Chart width in pixels (default: 700)
 * @param {number} height - Chart height in pixels (default: 260)
 * @param {number} padding - Inner padding in pixels (default: 32)
 */
const LineChart = ({ series, width = 700, height = 260, padding = 32 }) => {
  const allX = Array.from(new Set(series.flatMap(s => s.data.map(p => p.x))));
  const xIndex = (x) => allX.indexOf(x);
  const allY = series.flatMap(s => s.data.map(p => p.y));
  const minY = Math.min(0, ...allY);
  const maxY = Math.max(...allY, 1);
  const iw = width - padding * 2;
  const ih = height - padding * 2;
  const sx = (i) => (i / Math.max(allX.length - 1, 1)) * iw + padding;
  const sy = (v) => height - padding - ((v - minY) / Math.max(maxY - minY, 1)) * ih;

  // Retro bright colors - Neopets/Geocities inspired
  const colors = ['#9966ff', '#ff66cc', '#ffcc00', '#00ccff', '#00ff99', '#ff3366', '#cc00ff', '#ff9933'];
  const labelStep = allX.length > 24 ? Math.ceil(allX.length / 12) : (allX.length > 12 ? 2 : 1);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Line chart" style={{background: 'linear-gradient(135deg, #ffffdd 0%, #ffeeee 50%, #eeffff 100%)'}}>
      {/* Grid pattern background */}
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(153,102,255,0.1)" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect x={padding} y={padding} width={iw} height={ih} fill="url(#grid)" />

      {/* Axes - Bold retro style */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#330066" strokeWidth="3" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#330066" strokeWidth="3" />

      {/* Series with drop shadows */}
      {series.map((s, si) => {
        const d = s.data
          .filter(p => allX.includes(p.x))
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(xIndex(p.x))} ${sy(p.y)}`)
          .join(' ');
        const color = colors[si % colors.length];
        return (
          <g key={s.name}>
            {/* Drop shadow */}
            <path d={d} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="5" transform="translate(2, 2)" />
            {/* Main line - thick and bold */}
            <path d={d} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {/* Data points as circles */}
            {s.data.filter(p => allX.includes(p.x)).map((p, i) => (
              <g key={i}>
                <circle cx={sx(xIndex(p.x))} cy={sy(p.y)} r="6" fill="white" stroke={color} strokeWidth="3" />
                <circle cx={sx(xIndex(p.x))} cy={sy(p.y)} r="3" fill={color} />
              </g>
            ))}
          </g>
        );
      })}

      {/* X labels - bold */}
      {allX.map((x, i) => (
        i % labelStep === 0 ? (
          <text key={x} x={sx(i)} y={height - padding + 20} fontSize="12" fontWeight="bold" textAnchor="middle" fill="#330066">{x}</text>
        ) : null
      ))}

      {/* Y labels - bold with background */}
      {[minY, (minY+maxY)/2, maxY].map((v, i) => (
        <g key={i}>
          <rect x={padding - 50} y={sy(v) - 10} width="45" height="20" fill="white" stroke="#9966ff" strokeWidth="2" rx="4" />
          <text x={padding - 27} y={sy(v)} fontSize="11" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle" fill="#330066">{v.toFixed(0)}</text>
          <line x1={padding} y1={sy(v)} x2={width-padding} y2={sy(v)} stroke="rgba(153,102,255,0.3)" strokeWidth="1" strokeDasharray="4,4" />
        </g>
      ))}

      {/* Legend */}
      {series.map((s, si) => (
        <g key={s.name} transform={`translate(${width - 150}, ${20 + si * 25})`}>
          <rect x="0" y="0" width="140" height="20" fill="white" stroke={colors[si % colors.length]} strokeWidth="2" rx="4" />
          <line x1="5" y1="10" x2="25" y2="10" stroke={colors[si % colors.length]} strokeWidth="3" />
          <circle cx="15" cy="10" r="4" fill={colors[si % colors.length]} />
          <text x="30" y="10" fontSize="10" fontWeight="bold" alignmentBaseline="middle" fill="#330066">{s.name}</text>
        </g>
      ))}
    </svg>
  );
};

export default LineChart;
