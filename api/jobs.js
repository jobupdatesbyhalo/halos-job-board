export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const [remotive, arbeitnow, nomads] = await Promise.allSettled([
      fetch('https://remotive.com/api/remote-jobs?limit=100').then(r => r.json()),
      fetch('https://www.arbeitnow.com/api/job-board-api').then(r => r.json()),
      fetch('https://workingnomads.com/api/exposed_jobs/').then(r => r.json()),
    ]);

    let jobs = [];

    if (remotive.status === 'fulfilled') {
      jobs = [...jobs, ...(remotive.value.jobs || []).map(j => ({
        title: j.title,
        company: j.company_name,
        logo: j.company_logo_url,
        location: j.candidate_required_location || 'Worldwide',
        type: j.job_type,
        salary: j.salary,
        url: j.url,
        date: j.publication_date,
        category: j.category,
      }))];
    }

    if (arbeitnow.status === 'fulfilled') {
      jobs = [...jobs, ...(arbeitnow.value.data || []).filter(j => j.remote).map(j => ({
        title: j.title,
        company: j.company_name,
        location: 'Remote',
        type: 'Full-time',
        url: j.url,
        date: j.created_at,
      }))];
    }

    if (nomads.status === 'fulfilled') {
      jobs = [...jobs, ...(Array.isArray(nomads.value) ? nomads.value : []).map(j => ({
        title: j.title,
        company: j.company_name,
        logo: j.company_logo,
        location: 'Worldwide',
        type: 'Remote',
        url: j.url,
        date: j.pub_date,
      }))];
    }

    const blocked = ["usa only", "us only", "united states only", "germany only", "uk only", "canada only", "australia only"];
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

    res.status(200).json({ jobs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs', jobs: [] });
  }
}
