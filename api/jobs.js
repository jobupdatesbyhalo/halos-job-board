export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');
  
  const RAPIDAPI_KEY = '63a741b745msh11fcaf14afa7b5ep10bf8fjsn02c7f5838d86';
  const headers = { 'x-rapidapi-host': 'jsearch.p.rapidapi.com', 'x-rapidapi-key': RAPIDAPI_KEY };

  function isInternship(title, type) {
    const t = (title || '').toLowerCase();
    const ty = (type || '').toLowerCase();
    return t.includes('intern') || t.includes('internship') || t.includes('trainee') || t.includes('graduate') || ty.includes('intern');
  }

  try {
    const [
      remotive, remotiveIntern, arbeitnow, himalayas,
      ng1, remote1,
      intern1, intern2, intern3, intern4, intern5, intern6
    ] = await Promise.allSettled([
      fetch('https://remotive.com/api/remote-jobs?limit=150').then(r => r.json()),
      fetch('https://remotive.com/api/remote-jobs?category=all-others&limit=50').then(r => r.json()),
      fetch('https://www.arbeitnow.com/api/job-board-api').then(r => r.json()),
      fetch('https://himalayas.app/jobs/api?limit=100').then(r => r.json()),

      fetch('https://jsearch.p.rapidapi.com/search?query=jobs%20in%20nigeria&page=1&num_pages=3', { headers }).then(r => r.json()),
      fetch('https://jsearch.p.rapidapi.com/search?query=remote%20jobs&page=1&num_pages=3&remote_jobs_only=true', { headers }).then(r => r.json()),

      fetch('https://jsearch.p.rapidapi.com/search?query=internship&page=1&num_pages=5', { headers }).then(r => r.json()),
      fetch('https://jsearch.p.rapidapi.com/search?query=internship%20nigeria&page=1&num_pages=5', { headers }).then(r => r.json()),
      fetch('https://jsearch.p.rapidapi.com/search?query=remote%20internship&page=1&num_pages=5', { headers }).then(r => r.json()),
      fetch('https://jsearch.p.rapidapi.com/search?query=graduate%20trainee&page=1&num_pages=5', { headers }).then(r => r.json()),
      fetch('https://jsearch.p.rapidapi.com/search?query=internship%20marketing&page=1&num_pages=3', { headers }).then(r => r.json()),
      fetch('https://jsearch.p.rapidapi.com/search?query=internship%20tech%20design&page=1&num_pages=3', { headers }).then(r => r.json()),
    ]);

    let jobs = [];

    function addRemotive(result, forceInternship) {
      if (result.status !== 'fulfilled') return;
      jobs = [...jobs, ...(result.value.jobs || []).map(j => ({
        title: j.title, company: j.company_name, logo: j.company_logo_url,
        location: j.candidate_required_location || 'Worldwide',
        type: j.job_type, salary: j.salary, url: j.url,
        date: j.publication_date, category: j.category, source: 'Remotive',
        isInternship: forceInternship || isInternship(j.title, j.job_type)
      }))];
    }
    addRemotive(remotive, false);
    addRemotive(remotiveIntern, false);

    if (arbeitnow.status === 'fulfilled') {
      jobs = [...jobs, ...(arbeitnow.value.data || []).map(j => ({
        title: j.title, company: j.company_name,
        location: j.remote ? 'Remote' : (j.location || 'Worldwide'),
        type: 'Full-time', url: j.url, date: j.created_at,
        category: j.tags?.[0] || '', source: 'Arbeitnow',
        isInternship: isInternship(j.title, '')
      }))];
    }

    if (himalayas.status === 'fulfilled') {
      jobs = [...jobs, ...(himalayas.value.jobs || []).map(j => ({
        title: j.title, company: j.company?.name, logo: j.company?.logo,
        location: j.locationRestrictions?.join(', ') || 'Worldwide',
        type: j.jobType, salary: j.salary,
        url: j.applicationLink || j.url, date: j.publishedAt,
        category: j.categories?.[0] || '', source: 'Himalayas',
        isInternship: isInternship(j.title, j.jobType)
      }))];
    }

    function mapJSearch(result, defaultLocation, forceInternship) {
      if (result.status !== 'fulfilled') return [];
      return (result.value.data || []).map(j => ({
        title: j.job_title, company: j.employer_name, logo: j.employer_logo,
        location: j.job_city ? `${j.job_city}${j.job_country ? ', ' + j.job_country : ''}` : defaultLocation,
        type: j.job_employment_type,
        salary: j.job_salary_currency ? `${j.job_min_salary || ''}-${j.job_max_salary || ''} ${j.job_salary_currency}` : null,
        url: j.job_apply_link, date: j.job_posted_at_datetime_utc,
        source: 'JSearch',
        isInternship: forceInternship || isInternship(j.job_title, j.job_employment_type)
      }));
    }

    jobs = [...jobs,
      ...mapJSearch(ng1, 'Nigeria', false),
      ...mapJSearch(remote1, 'Worldwide', false),
      ...mapJSearch(intern1, 'Worldwide', true),
      ...mapJSearch(intern2, 'Nigeria', true),
      ...mapJSearch(intern3, 'Worldwide', true),
      ...mapJSearch(intern4, 'Worldwide', true),
      ...mapJSearch(intern5, 'Worldwide', true),
      ...mapJSearch(intern6, 'Worldwide', true),
    ];

    jobs = jobs.filter(j => j.title && j.url);

    const seen = new Set();
    jobs = jobs.filter(j => {
      const key = `${j.title}-${j.company}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.status(200).json({ jobs, total: jobs.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs', jobs: [], details: error.message });
  }
}
