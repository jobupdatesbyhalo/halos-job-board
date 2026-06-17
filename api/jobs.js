export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');
  
  const RAPIDAPI_KEY = '63a741b745msh11fcaf14afa7b5ep10bf8fjsn02c7f5838d86';

  try {
    const [remotive, arbeitnow, himalayas, jsearchNg, jsearchRemote] = await Promise.allSettled([
      fetch('https://remotive.com/api/remote-jobs?limit=150').then(r => r.json()),
      
      fetch('https://www.arbeitnow.com/api/job-board-api').then(r => r.json()),
      
      fetch('https://himalayas.app/jobs/api?limit=100').then(r => r.json()),

      fetch('https://jsearch.p.rapidapi.com/search?query=jobs%20in%20nigeria&page=1&num_pages=3', {
        headers: {
          'x-rapidapi-host': 'jsearch.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      }).then(r => r.json()),

      fetch('https://jsearch.p.rapidapi.com/search?query=remote%20jobs&page=1&num_pages=2&remote_jobs_only=true', {
        headers: {
          'x-rapidapi-host': 'jsearch.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      }).then(r => r.json()),
    ]);

    let jobs = [];

    if (remotive.status === 'fulfilled') {
      jobs = [...jobs, ...(remotive.value.jobs || []).map(j => ({
        title: j.title, company: j.company_name, logo: j.company_logo_url,
        location: j.candidate_required_location || 'Worldwide',
        type: j.job_type, salary: j.salary, url: j.url,
        date: j.publication_date, category: j.category, source: 'Remotive'
      }))];
    }

    if (arbeitnow.status === 'fulfilled') {
      jobs = [...jobs, ...(arbeitnow.value.data || []).filter(j => j.remote).map(j => ({
        title: j.title, company: j.company_name, location: 'Remote',
        type: 'Full-time', url: j.url, date: j.created_at,
        category: j.tags?.[0] || '', source: 'Arbeitnow'
      }))];
    }

    if (himalayas.status === 'fulfilled') {
      jobs = [...jobs, ...(himalayas.value.jobs || []).map(j => ({
        title: j.title, company: j.company?.name, logo: j.company?.logo,
        location: j.locationRestrictions?.join(', ') || 'Worldwide',
        type: j.jobType, salary: j.salary,
        url: j.applicationLink || j.url, date: j.publishedAt,
        category: j.categories?.[0] || '', source: 'Himalayas'
      }))];
    }

    if (jsearchNg.status === 'fulfilled') {
      jobs = [...jobs, ...(jsearchNg.value.data || []).map(j => ({
        title: j.job_title, company: j.employer_name, logo: j.employer_logo,
        location: j.job_city ? `${j.job_city}, Nigeria` : 'Nigeria',
        type: j.job_employment_type,
        salary: j.job_salary_currency ? `${j.job_min_salary || ''}-${j.job_max_salary || ''} ${j.job_salary_currency}` : null,
        url: j.job_apply_link, date: j.job_posted_at_datetime_utc,
        source: 'JSearch'
      }))];
    }

    if (jsearchRemote.status === 'fulfilled') {
      jobs = [...jobs, ...(jsearchRemote.value.data || []).map(j => ({
        title: j.job_title, company: j.employer_name, logo: j.employer_logo,
        location: 'Worldwide',
        type: j.job_employment_type,
        salary: j.job_salary_currency ? `${j.job_min_salary || ''}-${j.job_max_salary || ''} ${j.job_salary_currency}` : null,
        url: j.job_apply_link, date: j.job_posted_at_datetime_utc,
        source: 'JSearch'
      }))];
    }

    const blockedCountries = ["united states", "usa", "germany", "canada", "united kingdom", "australia", "france", "spain", "brazil"];

    jobs = jobs.filter(j => {
      const loc = (j.location || '').toLowerCase();
      const isNigeria = loc.includes('nigeria');
      const isWorldwideOrRemote = loc.includes('worldwide') || loc.includes('remote') || loc.includes('global') || loc.includes('anywhere') || loc === '';
      const hasBlockedCountry = blockedCountries.some(c => loc.includes(c));

      if (isNigeria) return true;
      if (isWorldwideOrRemote && !hasBlockedCountry) return true;
      if (!hasBlockedCountry && loc.length > 0) return true;
      return false;
    });

    const seen = new Set();
    jobs = jobs.filter(j => {
      const key = `${j.title}-${j.company}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    jobs = jobs.filter(j => j.title && j.url);

    res.status(200).json({ jobs, total: jobs.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs', jobs: [], details: error.message });
  }
}
