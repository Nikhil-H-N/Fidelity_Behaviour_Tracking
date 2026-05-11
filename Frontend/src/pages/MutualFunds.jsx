import { motion } from 'framer-motion';
import { Star, Search, Filter, ArrowUpDown, TrendingUp, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { mutualFunds } from '../data/mockData';
import { getRiskColor } from '../utils/formatters';
import { usePageTracking, useClickTracking } from '../hooks/useTracking';

export default function MutualFunds() {
  usePageTracking('mutual-funds');
  const trackClick = useClickTracking();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const categories = ['All', 'Large Cap', 'Mid Cap', 'Small Cap', 'Flexi Cap', 'Sectoral'];

  const filtered = mutualFunds.filter(f =>
    (filter === 'All' || f.category === filter) &&
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Mutual Funds</h1>
        <p className="text-surface-500 text-sm mt-1">Explore curated funds across categories</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input type="text" className="input-field pl-10 text-sm" placeholder="Search funds..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(c => (
            <button key={c} onClick={() => { setFilter(c); trackClick('filter_category', { category: c }); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === c ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Fund Cards */}
      <div className="grid gap-4">
        {filtered.map((fund, i) => (
          <motion.div key={fund.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-5 shadow-soft border border-surface-100 card-hover cursor-pointer">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-surface-900 truncate">{fund.name}</h3>
                  <span className="badge-info">{fund.category}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-surface-500">
                  <span>NAV: ₹{fund.nav}</span>
                  <span>AUM: {fund.aum}</span>
                  <span className={getRiskColor(fund.risk)}>{fund.risk}</span>
                  <span className="flex gap-0.5">{[...Array(5)].map((_, j) => <Star key={j} className={`w-3 h-3 ${j < fund.rating ? 'fill-amber-400 text-amber-400' : 'text-surface-300'}`} />)}</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center"><p className="text-xs text-surface-400">1Y Returns</p><p className="text-lg font-bold text-accent-600">+{fund.returns1y}%</p></div>
                <div className="text-center hidden md:block"><p className="text-xs text-surface-400">3Y Returns</p><p className="text-lg font-bold text-surface-700">+{fund.returns3y}%</p></div>
                <div className="text-center hidden lg:block"><p className="text-xs text-surface-400">5Y Returns</p><p className="text-lg font-bold text-surface-700">+{fund.returns5y}%</p></div>
                <button onClick={() => trackClick('start_sip', { fund: fund.name })}
                  className="btn-primary text-sm py-2 px-4 whitespace-nowrap gap-1">
                  Invest <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
