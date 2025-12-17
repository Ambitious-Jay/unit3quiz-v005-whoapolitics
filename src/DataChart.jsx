import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './DataChart.css';

function DataChart() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter state
  const [filterType, setFilterType] = useState('supplier'); // 'supplier' or 'item'
  const [selectedValue, setSelectedValue] = useState('');
  const [startDate, setStartDate] = useState({ year: 2017, month: 1 });
  const [endDate, setEndDate] = useState({ year: 2020, month: 1 });
  const [searchTerm, setSearchTerm] = useState('');

  // Load CSV data
  useEffect(() => {
    Papa.parse('/Warehouse_and_Retail_Sales.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setRawData(results.data);
        setLoading(false);
      },
      error: (err) => {
        setError('Failed to load data');
        setLoading(false);
        console.error(err);
      }
    });
  }, []);

  // Get unique suppliers and items
  const { suppliers, items, yearRange } = useMemo(() => {
    if (rawData.length === 0) return { suppliers: [], items: [], yearRange: { min: 2020, max: 2024 } };
    
    const supplierSet = new Set();
    const itemSet = new Set();
    let minYear = Infinity;
    let maxYear = -Infinity;

    rawData.forEach(row => {
      if (row.SUPPLIER) supplierSet.add(row.SUPPLIER);
      if (row['ITEM DESCRIPTION']) itemSet.add(row['ITEM DESCRIPTION']);
      const year = parseInt(row.YEAR);
      if (!isNaN(year)) {
        minYear = Math.min(minYear, year);
        maxYear = Math.max(maxYear, year);
      }
    });

    return {
      suppliers: Array.from(supplierSet).sort(),
      items: Array.from(itemSet).sort(),
      yearRange: { min: minYear === Infinity ? 2020 : minYear, max: maxYear === -Infinity ? 2024 : maxYear }
    };
  }, [rawData]);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    const options = filterType === 'supplier' ? suppliers : items;
    if (!searchTerm) return options.slice(0, 100); // Limit initial display
    return options.filter(opt => 
      opt.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 100);
  }, [filterType, suppliers, items, searchTerm]);

  // Check if date range is valid
  const isValidDateRange = useMemo(() => {
    const start = startDate.year * 12 + startDate.month;
    const end = endDate.year * 12 + endDate.month;
    return end >= start;
  }, [startDate, endDate]);

  // Process data for chart
  const chartData = useMemo(() => {
    if (!selectedValue || rawData.length === 0 || !isValidDateRange) return [];

    const filterField = filterType === 'supplier' ? 'SUPPLIER' : 'ITEM DESCRIPTION';
    
    // Filter by selected value and date range
    const filtered = rawData.filter(row => {
      if (row[filterField] !== selectedValue) return false;
      
      const year = parseInt(row.YEAR);
      const month = parseInt(row.MONTH);
      
      const rowDate = year * 12 + month;
      const start = startDate.year * 12 + startDate.month;
      const end = endDate.year * 12 + endDate.month;
      
      return rowDate >= start && rowDate <= end;
    });

    // Aggregate by month
    const monthlyData = {};
    filtered.forEach(row => {
      const key = `${row.YEAR}-${String(row.MONTH).padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = {
          month: key,
          retailSales: 0,
          warehouseSales: 0,
          retailTransfers: 0
        };
      }
      monthlyData[key].retailSales += parseFloat(row['RETAIL SALES']) || 0;
      monthlyData[key].warehouseSales += parseFloat(row['WAREHOUSE SALES']) || 0;
      monthlyData[key].retailTransfers += parseFloat(row['RETAIL TRANSFERS']) || 0;
    });

    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(d => ({
        ...d,
        retailSales: Math.round(d.retailSales * 100) / 100,
        warehouseSales: Math.round(d.warehouseSales * 100) / 100,
        retailTransfers: Math.round(d.retailTransfers * 100) / 100
      }));
  }, [rawData, selectedValue, filterType, startDate, endDate]);

  // Generate year/month options
  const generateDateOptions = () => {
    const options = [];
    for (let y = yearRange.min; y <= yearRange.max; y++) {
      for (let m = 1; m <= 12; m++) {
        options.push({ year: y, month: m });
      }
    }
    return options;
  };

  const dateOptions = generateDateOptions();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const formatDateOption = (opt) => `${monthNames[opt.month - 1]} ${opt.year}`;

  if (loading) {
    return (
      <div className="data-chart-container">
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>Loading sales data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="data-chart-container">
        <div className="chart-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="data-chart-container">
      <div className="chart-header">
        <h3>Sales Data Analysis</h3>
        <p className="chart-subtitle">Explore warehouse and retail sales trends</p>
        <a 
          href="https://catalog.data.gov/dataset/warehouse-and-retail-sales" 
          target="_blank" 
          rel="noopener noreferrer"
          className="data-source-link"
        >
          Data Source: Montgomery County, MD (Data.gov)
        </a>
      </div>

      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>Filter By</label>
            <div className="toggle-buttons">
              <button
                className={filterType === 'supplier' ? 'active' : ''}
                onClick={() => { setFilterType('supplier'); setSelectedValue(''); setSearchTerm(''); }}
              >
                Supplier
              </button>
              <button
                className={filterType === 'item' ? 'active' : ''}
                onClick={() => { setFilterType('item'); setSelectedValue(''); setSearchTerm(''); }}
              >
                Item
              </button>
            </div>
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group search-group">
            <label>Search {filterType === 'supplier' ? 'Supplier' : 'Item'}</label>
            <input
              type="text"
              placeholder={`Type to search ${filterType}s...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group select-group">
            <label>Select {filterType === 'supplier' ? 'Supplier' : 'Item'}</label>
            <select
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
              className="filter-select"
            >
              <option value="">-- Select --</option>
              {filteredOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {filteredOptions.length === 100 && (
              <span className="hint">Use search to narrow results</span>
            )}
          </div>
        </div>

        <div className="filter-row date-row">
          <div className="filter-group">
            <label>Start Date</label>
            <select
              value={`${startDate.year}-${startDate.month}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-').map(Number);
                setStartDate({ year: y, month: m });
              }}
              className="date-select"
            >
              {dateOptions.map(opt => (
                <option key={`start-${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                  {formatDateOption(opt)}
                </option>
              ))}
            </select>
          </div>
          <span className="date-separator">to</span>
          <div className="filter-group">
            <label>End Date</label>
            <select
              value={`${endDate.year}-${endDate.month}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-').map(Number);
                setEndDate({ year: y, month: m });
              }}
              className="date-select"
            >
              {dateOptions.map(opt => (
                <option key={`end-${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                  {formatDateOption(opt)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!isValidDateRange ? (
        <div className="chart-placeholder error">
          <div className="placeholder-icon">⚠️</div>
          <p>Invalid date range. End date must be after start date.</p>
        </div>
      ) : !selectedValue ? (
        <div className="chart-placeholder">
          <div className="placeholder-icon">📊</div>
          <p>Select a {filterType} above to view sales data</p>
        </div>
      ) : chartData.length === 0 ? (
        <div className="chart-placeholder">
          <div className="placeholder-icon">🔍</div>
          <p>No data found for the selected filters</p>
        </div>
      ) : (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="month" 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(26, 39, 68, 0.95)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '4px',
                  color: '#fff'
                }}
                labelStyle={{ color: '#d4af37', fontWeight: 'bold' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Line 
                type="monotone" 
                dataKey="retailSales" 
                name="Retail Sales"
                stroke="#c41e3a" 
                strokeWidth={2}
                dot={{ fill: '#c41e3a', r: 3 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="warehouseSales" 
                name="Warehouse Sales"
                stroke="#d4af37" 
                strokeWidth={2}
                dot={{ fill: '#d4af37', r: 3 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="retailTransfers" 
                name="Retail Transfers"
                stroke="#4a9eff" 
                strokeWidth={2}
                dot={{ fill: '#4a9eff', r: 3 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          
          <div className="chart-summary">
            <div className="summary-item">
              <span className="summary-label">Total Retail Sales</span>
              <span className="summary-value retail">
                {chartData.reduce((sum, d) => sum + d.retailSales, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Warehouse Sales</span>
              <span className="summary-value warehouse">
                {chartData.reduce((sum, d) => sum + d.warehouseSales, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Transfers</span>
              <span className="summary-value transfers">
                {chartData.reduce((sum, d) => sum + d.retailTransfers, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataChart;

