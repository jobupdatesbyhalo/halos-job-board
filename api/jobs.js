export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=1800');

  const RAPIDAPI_KEY = '63a741b745msh11fcaf14afa7b5ep10bf8fjsn02c7f5838d86';
  const headers = { 'x-rapidapi-host': 'jsearch.p.rapidapi.com', 'x-rapidapi-key': RAPIDAPI_KEY };

  function isInternship(title) {
    const t = (title || '').toLowerCase();
    return t.includes('intern') || t.includes('trainee') || t.includes('graduate');
  }

  let jobs = [];
  let debug = {};

  // 1. Remotive - general
  try {
    const r = await fetch('https://remotive.com/api/remote-jobs?limit=150');
    const d = await r.json();
    const mapped = (d.jobs || []).map(j => ({
      title: j.title, company: j.company_name, logo: j.company_logo_url,
      location: j.candidate_required_location || 'Worldwide',
      type: j.job_type, salary: j.salary, url: j.url,
      date: j.publication_date, category: j.category, source: 'Remotive',
      isInternship: isInternship(j.title) || j.job_type === 'internship'
    }));
    jobs = [...jobs, ...mapped];
    debug.remotive = mapped.length;
  } catch (e) { debug.remotive = 'failed: ' + e.message; }

  // 2. Remotive - internship search
  try {
    const r = await fetch('https://remotive.com/api/remote-jobs?search=intern&limit=50');
    const d = await r.json();
    const mapped = (d.jobs || []).map(j => ({
      title: j.title, company: j.company_name, logo: j.company_logo_url,
      location: j.candidate_required_location || 'Worldwide',
      type: j.job_type, salary: j.salary, url: j.url,
      date: j.publication_date, category: j.category, source: 'Remotive',
      isInternship: true
    }));
    jobs = [...jobs, ...mapped];
    debug.remotiveIntern = mapped.length;
  } catch (e) { debug.remotiveIntern = 'failed: ' + e.message; }

  // 3. Arbeitnow
  try {
    const r = await fetch('https://www.arbeitnow.com/api/job-board-api');
    const d = await r.json();
    const mapped = (d.data || []).map(j => ({
      title: j.title, company: j.company_name,
      location: j.remote ? 'Remote' : (j.location || 'Worldwide'),
      type: 'Full-time', url: j.url, date: j.created_at,
      category: j.tags?.[0] || '', source: 'Arbeitnow',
      isInternship: isInternship(j.title)
    }));
    jobs = [...jobs, ...mapped];
    debug.arbeitnow = mapped.length;
  } catch (e) { debug.arbeitnow = 'failed: ' + e.message; }

  // 4. Himalayas
  try {
    const r = await fetch('https://himalayas.app/jobs/api?limit=100');
    const d = await r.json();
    const mapped = (d.jobs || []).map(j => ({
      title: j.title, company: j.company?.name, logo: j.company?.logo,
      location: j.locationRestrictions?.join(', ') || 'Worldwide',
      type: j.jobType, salary: j.salary,
      url: j.applicationLink || j.url, date: j.publishedAt,
      category: j.categories?.[0] || '', source: 'Himalayas',
      isInternship: isInternship(j.title)
    }));
    jobs = [...jobs, ...mapped];
    debug.himalayas = mapped.length;
  } catch (e) { debug.himalayas = 'failed: ' + e.message; }

  // 5. JSearch - Nigeria jobs (separate try/catch, one call only)
  try {
    const r = await fetch('https://jsearch.p.rapidapi.com/search?query=jobs%20in%20nigeria&page=1&num_pages=3', { headers });
    const d = await r.json();
    const mapped = (d.data || []).map(j => ({
      title: j.job_title, company: j.employer_name, logo: j.employer_logo,
      location: j.job_city ? `${j.job_city}, Nigeria` : 'Nigeria',
      type: j.job_employment_type,
      salary: j.job_min_salary ? `${j.job_min_salary}-${j.job_max_salary} ${j.job_salary_currency || ''}` : null,
      url: j.job_apply_link, date: j.job_posted_at_datetime_utc,
      source: 'JSearch', isInternship: isInternship(j.job_title)
    }));
    jobs = [...jobs, ...mapped];
    debug.jsearchNigeria = mapped.length;
  } catch (e) { debug.jsearchNigeria = 'failed: ' + e.message; }

  // 6. JSearch - Internships (separate try/catch, one call only)
  try {
    const r = await fetch('https://jsearch.p.rapidapi.com/search?query=internship&page=1&num_pages=5', { headers });
    const d = await r.json();
    const mapped = (d.data || []).map(j => ({
      title: j.job_title, company: j.employer_name, logo: j.employer_logo,
      location: j.job_city ? `${j.job_city}${j.job_country ? ', ' + j.job_country : ''}` : 'Worldwide',
      type: j.job_employment_type,
      salary: j.job_min_salary ? `${j.job_min_salary}-${j.job_max_salary} ${j.job_salary_currency || ''}` : null,
      url: j.job_apply_link, date: j.job_posted_at_datetime_utc,
      source: 'JSearch', isInternship: true
    }));
    jobs = [...jobs, ...mapped];
    debug.jsearchInternship = mapped.length;
  } catch (e) { debug.jsearchInternship = 'failed: ' + e.message; }

  // 7. JSearch - Remote internship (separate try/catch)
  try {
    const r = await fetch('https://jsearch.p.rapidapi.com/search?query=remote%20internship&page=1&num_pages=5', { headers });
    const d = await r.json();
    const mapped = (d.data || []).map(j => ({
      title: j.job_title, company: j.employer_name, logo: j.employer_logo,
      location: 'Worldwide',
      type: j.job_employment_type,
      salary: j.job_min_salary ? `${j.job_min_salary}-${j.job_max_salary} ${j.job_salary_currency || ''}` : null,
      url: j.job_apply_link, date: j.job_posted_at_datetime_utc,
      source: 'JSearch', isInternship: true
    }));
    jobs = [...jobs, ...mapped];
    debug.jsearchRemoteIntern = mapped.length;
  } catch (e) { debug.jsearchRemoteIntern = 'failed: ' + e.message; }

  jobs = jobs.filter(j => j.title && j.url);

  const seen = new Set();
  jobs = jobs.filter(j => {
    const key = `${j.title}-${j.company}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const internshipCount = jobs.filter(j => j.isInternship).length;

  res.status(200).json({ jobs, total: jobs.length, internshipCount, debug });
}
