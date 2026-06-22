export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=1800');

  const RAPIDAPI_KEY = '63a741b745msh11fcaf14afa7b5ep10bf8fjsn02c7f5838d86';

  function isInternship(title) {
    const t = (title || '').toLowerCase();
    return t.includes('intern') || t.includes('trainee') || t.includes('graduate') || t.includes('praktikant') || t.includes('werkstudent');
  }

  let jobs = [];
  let jsearchStatus = 'not tried';

  // Remotive
  try {
      try {
    const r = await fetch('https://himalayas.app/jobs/api/search?employment_type=Intern&page=1');
    const d = await r.json();
    jobs = [...jobs, ...(d.jobs || []).map(j => ({
      title: j.title, company: j.companyName, logo: j.companyLogo,
      location: j.locationRestrictions?.join(', ') || 'Worldwide',
      type: 'Intern', salary: j.minSalary ? `${j.minSalary}-${j.maxSalary} ${j.currency || ''}` : null,
      url: j.applicationLink || j.url, date: j.publishedAt,
      category: j.categories?.[0] || '', source: 'Himalayas',
      isInternship: true
    }))];
  } catch (e) {}


  // Arbeitnow
  try {
    const r = await fetch('https://www.arbeitnow.com/api/job-board-api');
    const d = await r.json();
    jobs = [...jobs, ...(d.data || []).map(j => ({
      title: j.title, company: j.company_name,
      location: j.remote ? 'Remote' : (j.location || 'Worldwide'),
      type: 'Full-time', url: j.url, date: j.created_at,
      category: j.tags?.[0] || '', source: 'Arbeitnow',
      isInternship: isInternship(j.title)
    }))];
  } catch (e) {}

  // Himalayas
  try {
    const r = await fetch('https://himalayas.app/jobs/api?limit=100');
    const d = await r.json();
    jobs = [...jobs, ...(d.jobs || []).map(j => ({
      title: j.title, company: j.company?.name, logo: j.company?.logo,
      location: j.locationRestrictions?.join(', ') || 'Worldwide',
      type: j.jobType, salary: j.salary,
      url: j.applicationLink || j.url, date: j.publishedAt,
      category: j.categories?.[0] || '', source: 'Himalayas',
      isInternship: isInternship(j.title)
    }))];
  } catch (e) {}

  // JSearch - SINGLE TEST CALL
  try {
    const r = await fetch('https://jsearch.p.rapidapi.com/search?query=internship&num_pages=3', {
      headers: {
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
        'x-rapidapi-key': RAPIDAPI_KEY
      }
    });
    jsearchStatus = `HTTP ${r.status}`;
    const d = await r.json();
    jsearchStatus += ` | data length: ${(d.data || []).length} | message: ${d.message || 'none'}`;
    
    jobs = [...jobs, ...(d.data || []).map(j => ({
      title: j.job_title, company: j.employer_name, logo: j.employer_logo,
      location: j.job_city ? `${j.job_city}${j.job_country ? ', ' + j.job_country : ''}` : 'Worldwide',
      type: j.job_employment_type,
      salary: j.job_min_salary ? `${j.job_min_salary}-${j.job_max_salary} ${j.job_salary_currency || ''}` : null,
      url: j.job_apply_link, date: j.job_posted_at_datetime_utc,
      source: 'JSearch', isInternship: true
    }))];
  } catch (e) {
    jsearchStatus = 'error: ' + e.message;
  }

  jobs = jobs.filter(j => j.title && j.url);

  const seen = new Set();
  jobs = jobs.filter(j => {
    const key = `${j.title}-${j.company}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const internshipCount = jobs.filter(j => j.isInternship).length;

  res.status(200).json({ jobs, total: jobs.length, internshipCount, jsearchStatus });
}
