export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');
  
  try {
    const [remotive, arbeitnow, himalayas, nomads] = await Promise.allSettled([
      fetch('https://remotive.com/api/remote-jobs?limit=150', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }).then(r => r.json()),
      
      fetch('https://www.arbeitnow.com/api/job-board-api', {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
      }).then(r => r.json()),
      
      fetch('https://himalayas.app/jobs/api?limit=100', {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
      }).then(r => r.json()),

      fetch('https://workingnomads.com/api/exposed_jobs/?category=back-end-programming', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }).then(r => r.json()),
    ]);

    let jobs = [];

    if (remotive.status === 'fulfilled') {
      const mapped = (remotive.value.jobs || []).map(j => ({
        title: j.title,
        company: j.company_name,
        logo: j.company_logo_url,
        location: j.candidate_required_location || 'Worldwide',
        type: j.job_type,
        salary: j.salary,
        url: j.url,
        date: j.publication_date,
        category: j.category,
        source: 'Remotive'
      }));
      jobs = [...jobs, ...mapped];
    }

    if (arbeitnow.status === 'fulfilled') {
      const mapped = (arbeitnow.value.data || []).filter(j => j.remote).map(j => ({
        title: j.title,
        company: j.company_name,
        location: 'Remote',
        type: 'Full-time',
        url: j.url,
        date: j.created_at,
        category: j.tags?.[0] || '',
        source: 'Arbeitnow'
      }));
      jobs = [...jobs, ...mapped];
    }

    if (himalayas.status === 'fulfilled') {
      const mapped = (himalayas.value.jobs || []).map(j => ({
        title: j.title,
        company: j.company?.name,
        logo: j.company?.logo,
        location: j.locationRestrictions?.join(', ') || 'Worldwide',
        type: j.jobType,
        salary: j.salary,
        url: j.applicationLink || j.url,
        date: j.publishedAt,
        category: j.categories?.[0] || '',
        source: 'Himalayas'
      }));
      jobs = [...jobs, ...mapped];
    }

    if (nomads.status === 'fulfilled') {
      const mapped = (Array.isArray(nomads.value) ? nomads.value : []).map(j => ({
        title: j.title,
        company: j.company_name,
        logo: j.company_logo,
        location: 'Worldwide',
        type: 'Remote',
        url: j.url,
        date: j.pub_date,
        source: 'Working Nomads'
      }));
      jobs = [...jobs, ...mapped];
    }

    const blocked = ["usa only", "us only", "united states only", "germany only", "uk only", "canada only", "australia only", "europe only"];
    jobs = jobs.filter(j => {
      const loc = (j.location || '').toLowerCase();
      return !blocked.some(b => loc.includes(b));
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
    res.status(500).json({ error: 'Failed to fetch jobs', jobs: [] });
  }
}
