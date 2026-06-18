export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');
  
  const RAPIDAPI_KEY = '63a741b745msh11fcaf14afa7b5ep10bf8fjsn02c7f5838d86';
  const headers = { 'x-rapidapi-host': 'jsearch.p.rapidapi.com', 'x-rapidapi-key': RAPIDAPI_KEY };

  function isInternship(title, type) {
    const t = (title || '').toLowerCase();
    const ty = (type || '').toLowerCase();
    return t.includes('intern') || t.includes('internship') || t.includes('trainee') || t.includes('graduate trainee') || ty.includes('intern');
  }

  try {
    const [remotive, arbeitnow, himalayas, ng1, remote1, intern1, intern2, intern3, intern4, intern5] = await Promise.allSettled([
      fetch('https://remotive.com/api/remote-jobs?limit=150').then(r => r.json()),
      fetch('https://www.arbeitnow.com/api/job-board-api').then(r => r.json()),
      fetch('https://himalayas.app/jobs/api?limit=100').then(r => r.json()),
      fetch('https://jsearch.p.rapidapi.com/search?query=jobs%20in%20nigeria&page=1&num_pages=3', { headers }).then(r => r.json()),
      fetch('https://jsearch.p.rapidapi.com/search?query=remote%20jobs&page=1&num_pages=3&remote_jobs_only=true', { headers }).then(r => r.json()),
      fetch('https://jsearch.p.rapidapi.com/search?query=internship%20nigeria%202025&page=1&num_pages=3', { headers }).then(r => r.json()),
      fetch('https://jsearch.p.rapidapi.com/search?query=remote%20internship%20worldwide&page=1&num_pages=3', { headers }).then(r => r.json()),
      fetch('https://jsearch.p.rapidapi.com/search?query=graduate%20trainee%20program%20nigeria&page=1&num_pages=3', { headers }).then(r => r.json()),
      fetch('https://jsearch.p.rapidapi.com/search?query=internship%20marketing%20remote&page=1&num_pages=2', { headers }).then(r => r.json()),
      fetch('https://jsearch.p.rapidapi.com/search?query=internship%20tech%20remote&page=1&num_pages=2', { headers }).then(r => r.json()),
    ]);

    let jobs = [];

    if (remotive.status === 'fulfilled') {
      jobs = [...jobs, ...(remotive.value.jobs || []).map(j => ({
        title: j.title, company: j.company_name, logo: j.company_logo_url,
        location: j.candidate_required_location || 'Worldwide',
        type: j.job_type, salary: j.salary, url: j.url,
        date: j.publication_date, category: j.category, source: 'Remotive',
        isInternship: isInternship(j.title, j.job_type)
      }))];
    }

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
      ...mapJSearch(intern1, 'Nigeria', true),
      ...mapJSearch(intern2, 'Worldwide', true),
      ...mapJSearch(intern3, 'Nigeria', true),
      ...mapJSearch(intern4, 'Worldwide', true),
      ...mapJSearch(intern5, 'Worldwide', true),
    ];

    // Add hardcoded internship opportunities from verified sources
    const hardcodedInternships = [
      { title: "Social Media Intern", company: "Dillish Instant Foods", location: "Remote, Nigeria", type: "Internship", url: "https://shorturl.at/jY5OD", source: "Launchpad", isInternship: true },
      { title: "Customer Service Intern", company: "My Afri Mall Logistics", location: "Lagos, Nigeria", type: "Internship", url: "https://shorturl.at/7hvn6", source: "Launchpad", isInternship: true },
      { title: "Administrative Assistant Intern", company: "Lo'Sewdium", location: "Lagos, Nigeria", type: "Internship", url: "https://shorturl.at/hlv8D", source: "Launchpad", isInternship: true },
      { title: "Personal Assistant Intern", company: "The Corporate Tea", location: "Lagos, Nigeria", type: "Internship", url: "https://shorturl.at/dP091", source: "Launchpad", isInternship: true },
      { title: "Accountant Intern", company: "Stanforte Edge", location: "Lagos, Nigeria", type: "Internship", url: "https://shorturl.at/6t4dG", source: "Launchpad", isInternship: true },
      { title: "NYSC Intern", company: "Smart Consultancy", location: "Lagos, Nigeria", type: "Internship", url: "https://shorturl.at/j2V9t", source: "Launchpad", isInternship: true },
      { title: "Accountant Intern", company: "Skeel Hunters", location: "Lagos, Nigeria", type: "Internship", url: "https://shorturl.at/IRFgb", source: "Launchpad", isInternship: true },
      { title: "Front Desk Intern", company: "Home Work Group Africa", location: "Lagos, Nigeria", type: "Internship", url: "https://shorturl.at/awMte", source: "Launchpad", isInternship: true },
      { title: "Project Manager Intern", company: "Oxgital", location: "Lagos, Nigeria", type: "Internship", url: "https://shorturl.at/ZOZBY", source: "Launchpad", isInternship: true },
      { title: "Journalism & Content Intern", company: "Adamimgo FM", location: "Lagos, Nigeria", type: "Internship", url: "https://drive.google.com/file/d/1bNQrHJHpCkhJDiYWIqSmv9hBOsEQkRPF/view", source: "Launchpad", isInternship: true },
      { title: "Content Creator Intern", company: "Bestate Investment", location: "Lagos, Nigeria", type: "Internship", url: "https://tinyurl.com/2eb4yk84", source: "Launchpad", isInternship: true },
      { title: "NYSC Media Intern", company: "Boss Meek Media", location: "Lagos, Nigeria", type: "Internship", url: "https://tinyurl.com/33r77kmh", source: "Launchpad", isInternship: true },
      { title: "Media Intern", company: "Women in Media", location: "Lagos, Nigeria", type: "Internship", url: "https://tinyurl.com/4ucr5j6a", source: "Launchpad", isInternship: true },
      { title: "Business Management Intern", company: "TG Group", location: "Ogun State, Nigeria", type: "Internship", url: "https://tinyurl.com/yahrub6n", source: "Launchpad", isInternship: true },
      { title: "Graduate Trainee", company: "Dangote Refinery", location: "Lagos, Nigeria", type: "Graduate Trainee", url: "https://dangote.com/careers", source: "Launchpad", isInternship: true },
      { title: "Graduate Management Trainee", company: "Dufil Prima Foods", location: "Lagos, Nigeria", type: "Graduate Trainee", url: "https://recruitment.dragnet-solutions.com/portal/apply?d=dufilprima&details=551", source: "Launchpad", isInternship: true },
      { title: "Global Graduate Program", company: "Heineken Nigerian Breweries", location: "Lagos, Nigeria", type: "Graduate Trainee", url: "https://careers.theheinekencompany.com", source: "Launchpad", isInternship: true },
      { title: "Graduate Trainee", company: "Hydropet Oil Service", location: "Port Harcourt, Nigeria", type: "Graduate Trainee", url: "https://shorturl.at/v8q2A", source: "Launchpad", isInternship: true },
      { title: "Graduate Trainee", company: "GTI Investment Group", location: "Lagos, Nigeria", type: "Graduate Trainee", url: "https://forms.gle/gRozXZ3MtCwEywfz9", source: "Launchpad", isInternship: true },
      { title: "Investment Analyst Trainee", company: "Sahel Capital", location: "Lagos, Nigeria", type: "Graduate Trainee", url: "https://hris.peoplehum.com/ehire/jobs/8e354558", source: "Launchpad", isInternship: true },
      { title: "Graduate Intern Finance", company: "ACE Strategy and Consults", location: "Remote, Nigeria", type: "Internship", url: "https://acestrategy.org/job-listings/", source: "Launchpad", isInternship: true },
      { title: "Talent Acquisition Intern", company: "Pivotage Consulting", location: "Lagos, Nigeria", type: "Internship", url: "https://bit.ly/3Pceuzd", source: "Launchpad", isInternship: true },
      { title: "Graduate Trainee", company: "Snapnet", location: "Nigeria", type: "Graduate Trainee", url: "https://jobs.smartyacad.com/snapnet-graduate-trainee-program-2026-mid-year-stream/", source: "Launchpad", isInternship: true },
      { title: "Graduate Engineering Trainee", company: "Quantum Steels", location: "Lagos, Nigeria", type: "Graduate Trainee", url: "https://jobs.smartyacad.com/2026-quantum-steels-graduate-engineering-trainee-program/", source: "Launchpad", isInternship: true },
      { title: "Graduate Management Trainee", company: "International Breweries", location: "Nigeria", type: "Graduate Trainee", url: "https://wd1.myworkdaysite.com/en-US/recruiting/abinbev/NGA", source: "Launchpad", isInternship: true },
      { title: "Blue Internship Programme", company: "Stanbic IBTC", location: "Lagos, Nigeria", type: "Internship", url: "https://stanbicibtcbank.com/careers", source: "Launchpad", isInternship: true },
      { title: "Graduate Trainee", company: "Seplat Energy", location: "Lagos, Nigeria", type: "Graduate Trainee", url: "https://seplatenergy.com/careers", source: "Launchpad", isInternship: true },
      { title: "Graduate Take-Off Programme", company: "InEvent", location: "Remote, Worldwide", type: "Internship", url: "https://inevent.com/careers", source: "Launchpad", isInternship: true },
      { title: "Oil & Gas Field Readiness Training", company: "NCDMB", location: "Nigeria", type: "Graduate Trainee", url: "https://nogicjqs.gov.ng/auth/register", source: "Launchpad", isInternship: true },
      { title: "Graduate Trainee", company: "BUA Foods", location: "Nigeria", type: "Graduate Trainee", url: "https://buafoods.com/careers", source: "Launchpad", isInternship: true },
    ];

    jobs = [...jobs, ...hardcodedInternships];
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
