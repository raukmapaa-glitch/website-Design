"""Generate the static HTML pages. Run: python3 build_pages.py

The generated public/*.html files can also be edited directly. This script keeps
the shared navigation/footer consistent across pages.
"""
from pathlib import Path
from html import escape

ROOT = Path(__file__).parent / "public"
NAV = [
    ("index.html", "Home"), ("about.html", "About"),
    ("classes.html", "Classes"), ("timetable.html", "Timetable"),
    ("pricing.html", "Pricing"), ("trainers.html", "Trainers"),
    ("membership.html", "Membership"), ("community.html", "Community"),
    ("contact.html", "Contact"),
]


def page_hero(kicker, title, description):
    return f'''<section class="page-hero"><div class="container">
      <span class="eyebrow light">{kicker}</span><h1>{title}</h1><p>{description}</p>
    </div></section>'''


PAGES = {
"index": ("Train with purpose", "Discover Jiu-jitsu, judo, karate and Muay Thai at DoBu Martial Arts.", '''
<section class="hero"><img class="hero-photo" src="/assets/hero-dojo.webp" alt="Two martial artists practising a controlled judo movement in a dojo" width="1947" height="808" fetchpriority="high"><div class="container hero-grid">
  <div class="hero-copy"><span class="eyebrow light">DoBu Martial Arts / Train with purpose</span>
    <h1>Find your strength. <em>Own your journey.</em></h1>
    <p>Build confidence, sharpen your skills and train alongside a welcoming community. Martial arts, fitness and self-defence for every stage.</p>
    <div class="button-row"><a class="button" href="/pricing.html">Explore memberships <span aria-hidden="true">↗</span></a><a class="button outline" href="/timetable.html">View timetable</a></div>
    <div class="hero-facts"><div><strong>4 disciplines</strong><span>Find your style</span></div><div><strong>All levels</strong><span>Start where you are</span></div><div><strong>7 days</strong><span>Classes through the week</span></div></div>
  </div>
</div></section>
<section class="section"><div class="container intro-grid">
  <div><span class="eyebrow">Welcome to DoBu</span><h2>A place to get stronger together.</h2><p class="lede">Step onto the mat with a class that fits your goals, whether you want to learn a new skill, keep active or grow your confidence.</p><ul class="checks"><li>Sessions for adults and children</li><li>Coaching across four martial arts</li><li>Fitness and personal training options</li><li>Space to practise at your own pace</li></ul><a class="button dark" href="/about.html">Get to know us</a></div>
  <div class="intro-panel"><span class="eyebrow light">Your space to thrive</span><h2>More than a mat.</h2><p>Train in the large matted martial arts area or fully equipped fitness room. Changing and shower facilities, a sauna and a steam room complete the gym.</p><a class="button outline" href="/classes.html">Explore what we offer</a></div>
</div></section>
<section class="section surface"><div class="container"><div class="section-head"><div><span class="eyebrow">Choose your discipline</span><h2>Find the right way to move.</h2></div><a class="button ghost" href="/classes.html">All classes</a></div>
<div class="discipline-grid">
  <a class="discipline-card" href="/classes.html#jiu-jitsu"><img src="/assets/jiu-jitsu.webp" alt="Jiu-jitsu practitioners training on a mat" loading="lazy" width="1448" height="1086"><span class="discipline-copy"><small>01 / GRAPPLING</small><strong>Jiu-jitsu</strong><span>Explore class <span aria-hidden="true">↗</span></span></span></a>
  <a class="discipline-card" href="/classes.html#karate"><img src="/assets/karate.webp" alt="Karate practitioner performing a kata punch" loading="lazy" width="1448" height="1086"><span class="discipline-copy"><small>02 / STRIKING</small><strong>Karate</strong><span>Explore class <span aria-hidden="true">↗</span></span></span></a>
  <a class="discipline-card" href="/classes.html#judo"><img src="/assets/judo.webp" alt="Two judo practitioners practising a throw entry" loading="lazy" width="1448" height="1086"><span class="discipline-copy"><small>03 / THROWING</small><strong>Judo</strong><span>Explore class <span aria-hidden="true">↗</span></span></span></a>
  <a class="discipline-card" href="/classes.html#muay-thai"><img src="/assets/muay-thai.webp" alt="Muay Thai athlete practising a kick on a pad" loading="lazy" width="1448" height="1086"><span class="discipline-copy"><small>04 / STRIKING</small><strong>Muay Thai</strong><span>Explore class <span aria-hidden="true">↗</span></span></span></a>
</div></div></section>
<section class="section dark-band"><div class="container two-col"><div><span class="eyebrow light">Join your way</span><h2>Make the mat your own.</h2><p class="lede">Choose from flexible monthly plans, junior sessions, private tuition or a six-week beginners’ self-defence course.</p><a class="button" href="/pricing.html">See prices and options</a></div><div class="card light-card"><span class="tag">Starting at</span><p class="home-price">£25 <small>/ month</small></p><h3>Basic membership</h3><p>One martial art, two sessions a week. A simple way to begin your training.</p></div></div></section>
<section class="section-sm"><div class="container cta-band"><div><h2>Ready to take your first step?</h2><p>Explore the timetable, then create an account to save a membership preference.</p></div><a class="button dark" href="/login.html?tab=register">Create an account</a></div></section>
'''),

"about": ("About DoBu", "Meet the team and facilities behind DoBu Martial Arts.", page_hero("About the gym", "Training with purpose.", "A welcoming place for martial arts, fitness training and self-defence.") + '''
<section class="section"><div class="container intro-grid"><div><span class="eyebrow">Our approach</span><h2>Progress starts with showing up.</h2><p class="lede">DoBu Martial Arts brings together four disciplines and experienced coaches, giving members room to learn, practise and improve at their own pace.</p><p>Choose regular group classes, junior martial arts sessions, private tuition, fitness training or a beginners’ self-defence course. Check the timetable to find a suitable time.</p><a class="button dark" href="/timetable.html">See the schedule</a></div><div class="intro-panel photo-panel"><span class="eyebrow light">What you will find</span><h2>Everything in one place.</h2><ul class="checks"><li>Large matted martial arts area</li><li>Fully equipped fitness room</li><li>Sauna and steam room</li><li>Changing and shower facilities</li></ul></div></div></section>
<section class="section surface"><div class="container"><span class="eyebrow">How we train</span><h2>One community. Many ways in.</h2><div class="cards"><article class="card"><span class="card-icon" aria-hidden="true">01</span><h3>Learn the basics</h3><p>Start with clear coaching and build technique with practice.</p></article><article class="card"><span class="card-icon" aria-hidden="true">02</span><h3>Keep progressing</h3><p>Use regular classes and open mat time to develop your skills.</p></article><article class="card"><span class="card-icon" aria-hidden="true">03</span><h3>Train together</h3><p>Train alongside fellow members and build confidence through regular practice.</p></article></div></div></section>
<section class="section-sm"><div class="container cta-band"><div><h2>Get to know your coaches.</h2><p>Explore the experience and qualifications behind the classes.</p></div><a class="button dark" href="/trainers.html">Meet the team</a></div></section>
'''),

"classes": ("Classes and training", "Explore DoBu Martial Arts classes, kids sessions, fitness and self-defence.", page_hero("What we teach", "A class for every goal.", "Choose your discipline or combine martial arts with fitness training.") + '''
<section class="section"><div class="container"><div class="section-head"><div><span class="eyebrow">Martial arts</span><h2>Discover your discipline.</h2></div><a class="button ghost" href="/timetable.html">See class times</a></div><div class="feature-grid">
<article class="feature photo-feature" id="jiu-jitsu"><img src="/assets/jiu-jitsu.webp" alt="Two adults practising Jiu-jitsu grappling" loading="lazy" width="1448" height="1086"><div class="feature-body"><b>01 / Grappling</b><h3>Jiu-jitsu</h3><p>Learn positioning, leverage and controlled grappling in a supportive class setting. Adult and kids sessions are on the timetable.</p></div></article>
<article class="feature photo-feature" id="karate"><img src="/assets/karate.webp" alt="Adult karate practitioner training" loading="lazy" width="1448" height="1086"><div class="feature-body"><b>02 / Striking</b><h3>Karate</h3><p>Practise striking, movement and focus. Regular adult classes and kids karate sessions are available.</p></div></article>
<article class="feature photo-feature" id="judo"><img src="/assets/judo.webp" alt="Judo partners practising grips and balance" loading="lazy" width="1448" height="1086"><div class="feature-body"><b>03 / Throws</b><h3>Judo</h3><p>Develop balance, movement and throwing technique with guidance from qualified coaches. Adult and kids sessions are available.</p></div></article>
<article class="feature photo-feature" id="muay-thai"><img src="/assets/muay-thai.webp" alt="Muay Thai athlete practising with a pad holder" loading="lazy" width="1448" height="1086"><div class="feature-body"><b>04 / Striking</b><h3>Muay Thai</h3><p>Train striking combinations, coordination and conditioning across the weekly schedule.</p></div></article>
</div></div></section>
<section class="section surface"><div class="container"><span class="eyebrow">More ways to train</span><h2>Build your own routine.</h2><div class="cards"><article class="card"><span class="card-icon" aria-hidden="true">↗</span><h3>Private martial arts tuition</h3><p>One-to-one tuition priced by the hour, with time slots shown on the timetable.</p></article><article class="card"><span class="card-icon" aria-hidden="true">✦</span><h3>Beginners’ self-defence</h3><p>A six-week course with two one-hour sessions per week.</p></article><article class="card"><span class="card-icon" aria-hidden="true">+</span><h3>Fitness training</h3><p>Use the fitness room per visit or book personal fitness training by the hour.</p></article></div></div></section>
<section class="section-sm"><div class="container cta-band"><div><h2>Find a time that works.</h2><p>Classes, kids sessions, practice time and private tuition throughout the week.</p></div><a class="button dark" href="/timetable.html">View timetable</a></div></section>
'''),

"pricing": ("Memberships and pricing", "DoBu Martial Arts membership fees, private tuition and fitness prices.", page_hero("Membership options", "Your training, your pace.", "Explore monthly memberships and pay-as-you-go training options. Prices are in pounds sterling.") + '''
<section class="section"><div class="container"><div class="section-head"><div><span class="eyebrow">Monthly plans</span><h2>Choose what fits.</h2></div><p class="lede">Save your preference in your member account. Payment is not collected on this demo site.</p></div><div class="price-grid">
<article class="price-card"><span class="tag">Start here</span><h3>Basic</h3><div class="price">£25 <small>/ month</small></div><p>A steady start in your chosen discipline.</p><ul><li>1 martial art</li><li>2 sessions per week</li></ul><a class="button dark" href="/membership.html?plan=basic">Choose Basic</a></article>
<article class="price-card"><span class="tag">Build momentum</span><h3>Intermediate</h3><div class="price">£35 <small>/ month</small></div><p>More time to practise each week.</p><ul><li>1 martial art</li><li>3 sessions per week</li></ul><a class="button dark" href="/membership.html?plan=intermediate">Choose Intermediate</a></article>
<article class="price-card"><span class="tag">Explore more</span><h3>Advanced</h3><div class="price">£45 <small>/ month</small></div><p>Train in two different disciplines.</p><ul><li>Any 2 martial arts</li><li>5 sessions per week</li></ul><a class="button dark" href="/membership.html?plan=advanced">Choose Advanced</a></article>
<article class="price-card featured"><span class="tag">Unlimited</span><h3>Elite</h3><div class="price">£60 <small>/ month</small></div><p>Make the most of the full class schedule.</p><ul><li>Unlimited classes</li><li>Train across disciplines</li></ul><a class="button" href="/membership.html?plan=elite">Choose Elite</a></article>
<article class="price-card"><span class="tag">For children</span><h3>Junior</h3><div class="price">£25 <small>/ month</small></div><p>Martial arts sessions designed for kids.</p><ul><li>All kids martial arts sessions</li><li>See the weekly timetable</li></ul><a class="button dark" href="/membership.html?plan=junior">Choose Junior</a></article>
</div></div></section>
<section class="section surface"><div class="container"><span class="eyebrow">Specialist options</span><h2>Train your way.</h2><div class="simple-table-wrap"><table class="simple-table"><thead><tr><th scope="col">Service</th><th scope="col">Details</th><th scope="col">Price</th></tr></thead><tbody>
<tr><td>Private martial arts tuition</td><td>Per hour</td><td>£15.00</td></tr>
<tr><td>Beginners’ self-defence course</td><td>Six weeks, two 1-hour sessions per week</td><td>£180.00</td></tr>
<tr><td>Fitness room</td><td>Per visit</td><td>£6.00</td></tr>
<tr><td>Personal fitness training</td><td>Per hour</td><td>£35.00</td></tr>
</tbody></table></div></div></section>
<section class="section-sm"><div class="container cta-band"><div><h2>Need help choosing?</h2><p>Compare the timetable with your goals or send the team a question.</p></div><a class="button dark" href="/contact.html">Contact us</a></div></section>
'''),

"timetable": ("Class timetable", "Weekly DoBu Martial Arts timetable for adults, kids, private tuition and open mat.", page_hero("Weekly schedule", "Make time to move.", "Browse the weekly class timetable. Empty cells mean no class is listed for that time.") + '''
<section class="section"><div class="container"><div class="section-head"><div><span class="eyebrow">Monday to Sunday</span><h2>Find your next session.</h2></div><a class="button ghost" href="/pricing.html">View prices</a></div><p class="notice">On smaller screens, swipe the timetable sideways to see all seven days. “Open mat” is personal practice time.</p>
<div class="timetable-wrap" role="region" aria-label="Weekly class timetable, scroll horizontally on small screens" tabindex="0"><table class="timetable"><caption class="visually-hidden">DoBu Martial Arts weekly class timetable</caption><thead><tr><th scope="col">Time</th><th scope="col">Monday</th><th scope="col">Tuesday</th><th scope="col">Wednesday</th><th scope="col">Thursday</th><th scope="col">Friday</th><th scope="col">Saturday</th><th scope="col">Sunday</th></tr></thead><tbody>
<tr><th scope="row">06:00–07:30</th><td>Jiu-jitsu</td><td>Karate</td><td>Judo</td><td>Jiu-jitsu</td><td>Muay Thai</td><td></td><td></td></tr>
<tr><th scope="row">08:00–10:00</th><td>Muay Thai</td><td class="private">Private tuition</td><td class="private">Private tuition</td><td class="private">Private tuition</td><td>Jiu-jitsu</td><td class="private">Private tuition</td><td class="private">Private tuition</td></tr>
<tr><th scope="row">10:30–12:00</th><td class="private">Private tuition</td><td class="private">Private tuition</td><td class="private">Private tuition</td><td class="private">Private tuition</td><td class="private">Private tuition</td><td>Judo</td><td>Karate</td></tr>
<tr><th scope="row">13:00–14:30</th><td>Open mat / personal practice</td><td>Open mat / personal practice</td><td>Open mat / personal practice</td><td>Open mat / personal practice</td><td>Open mat / personal practice</td><td>Karate</td><td>Judo</td></tr>
<tr><th scope="row">15:00–17:00</th><td class="kids">Kids jiu-jitsu</td><td class="kids">Kids judo</td><td class="kids">Kids karate</td><td class="kids">Kids jiu-jitsu</td><td class="kids">Kids judo</td><td>Muay Thai</td><td>Jiu-jitsu</td></tr>
<tr><th scope="row">17:30–19:00</th><td>Karate</td><td>Muay Thai</td><td>Judo</td><td>Jiu-jitsu</td><td>Muay Thai</td><td></td><td></td></tr>
<tr><th scope="row">19:00–21:00</th><td>Jiu-jitsu</td><td>Judo</td><td>Jiu-jitsu</td><td>Karate</td><td class="private">Private tuition</td><td></td><td></td></tr>
</tbody></table></div></div></section>
<section class="section-sm"><div class="container cta-band"><div><h2>Found your time?</h2><p>Choose a membership that matches the number of sessions you want each week.</p></div><a class="button dark" href="/pricing.html">Compare plans</a></div></section>
'''),

"trainers": ("Our instructors", "Meet the DoBu Martial Arts coaches and their qualifications.", page_hero("Meet the team", "Guidance that moves you forward.", "Learn about the martial arts and fitness coaches at DoBu.") + '''
<section class="section"><div class="container"><span class="eyebrow">Martial arts coaching</span><h2>Learn from the team.</h2><div class="trainer-grid">
<article class="trainer-card"><div class="trainer-visual" aria-hidden="true">MG</div><div class="trainer-copy"><span class="tag">Owner & head coach</span><h3>Mauricio Gomez</h3><p>Coaches in all martial arts.</p><ul><li>4th Dan Blackbelt judo</li><li>3rd Dan Blackbelt jiu-jitsu</li><li>1st Dan Blackbelt karate</li><li>Accredited Muay Thai coach</li></ul></div></article>
<article class="trainer-card"><div class="trainer-visual" aria-hidden="true">SN</div><div class="trainer-copy"><span class="tag">Assistant coach</span><h3>Sarah Nova</h3><p>Martial arts coach.</p><ul><li>5th Dan karate</li></ul></div></article>
<article class="trainer-card"><div class="trainer-visual" aria-hidden="true">GV</div><div class="trainer-copy"><span class="tag">Assistant coach</span><h3>Guy Victory</h3><p>Martial arts coach.</p><ul><li>2nd Dan Blackbelt jiu-jitsu</li><li>1st Dan Blackbelt judo</li></ul></div></article>
<article class="trainer-card"><div class="trainer-visual" aria-hidden="true">MD</div><div class="trainer-copy"><span class="tag">Assistant coach</span><h3>Morris Davis</h3><p>Martial arts coach.</p><ul><li>Accredited Muay Thai coach</li><li>3rd Dan Blackbelt karate</li></ul></div></article>
<article class="trainer-card"><div class="trainer-visual" aria-hidden="true">TS</div><div class="trainer-copy"><span class="tag">Fitness coach</span><h3>Traci Santiago</h3><p>Strength and conditioning for combat athletes.</p><ul><li>BSc in Sports Science</li><li>Qualified in health and nutrition</li></ul></div></article>
<article class="trainer-card"><div class="trainer-visual" aria-hidden="true">HK</div><div class="trainer-copy"><span class="tag">Fitness coach</span><h3>Harpreet Kaur</h3><p>Fitness coaching.</p><ul><li>BSc in Physiotherapy</li><li>MSc in Sports Science</li></ul></div></article>
</div></div></section>
<section class="section-sm"><div class="container cta-band"><div><h2>Train with us.</h2><p>See when classes and private tuition are listed during the week.</p></div><a class="button dark" href="/timetable.html">View timetable</a></div></section>
'''),

"membership": ('My membership', 'Manage your DoBu Martial Arts plan preference.', '''
<section class="page-hero">
      <div class="container">
        <span class="eyebrow light">Member area</span>
        <h1>Your training, in one place.</h1>
        <p>Create an account, sign in and manage your membership preference.</p>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div id="membership-status" class="form-card" role="status" aria-live="polite">
          <h2 id="membership-status-heading">Loading your account…</h2>
          <p id="membership-status-message">Checking your sign-in status. Please wait.</p>
          <button class="button dark" id="membership-retry" type="button" hidden>Try again</button>
        </div>
        <noscript><p>Please enable JavaScript to sign in and manage your membership.</p></noscript>
        <div id="membership-guest" class="intro-grid" hidden>
          <div><span class="eyebrow">Member account</span>
            <h2>Manage your DoBu membership.</h2>
            <p id="membership-signin-notice" class="form-message" role="status" hidden></p>
            <p class="lede">Create an account to save, change or clear your membership preference in one place.
            </p>
            <div class="button-row"><a class="button dark" id="membership-register-link"
                href="/login.html?tab=register">Create an account</a><a class="button ghost" id="membership-login-link"
                href="/login.html">Sign in</a></div>
          </div>
          <div class="intro-panel"><span class="eyebrow light">Memberships</span>
            <h2>A plan for your pace.</h2>
            <p>From Basic to Elite and Junior, compare the options before saving your choice.</p><a
              class="button outline" href="/pricing.html">Compare plans</a>
          </div>
        </div>
        <div id="membership-account" hidden>
          <div class="section-head">
            <div><span class="eyebrow">My account</span>
              <h2>Welcome back, <span id="member-name"></span>.</h2>
            </div><button class="button ghost small" id="logout-button" type="button">Sign out</button>
          </div>
          <div class="account-panel">
            <div class="account-detail">
              <p class="muted">Your email</p><strong id="member-email"></strong>
              <p class="muted spaced">Selected plan</p><strong id="current-plan"></strong>
              <p class="muted spaced">This is a saved preference. The demo does not enrol you in paid classes or collect
                payment.</p>
            </div>
            <form class="form-card" id="membership-form">
              <h3>Update your plan preference</h3>
              <div class="field"><label for="member-plan">Membership plan</label><select id="member-plan" name="plan">
                  <option value="">No plan selected</option>
                  <option value="basic">Basic — £25 / month</option>
                  <option value="intermediate">Intermediate — £35 / month</option>
                  <option value="advanced">Advanced — £45 / month</option>
                  <option value="elite">Elite — £60 / month</option>
                  <option value="junior">Junior — £25 / month</option>
                </select></div><button class="button dark" type="submit">Save preference</button>
              <p class="form-message" role="status" aria-live="polite"></p>
            </form>
          </div>
        </div>
      </div>
    </section>
'''),

"community": ('Community', 'Join the DoBu Martial Arts member discussion board.', '''
<section class="page-hero">
      <div class="container">
        <span class="eyebrow light">Community</span>
        <h1>Keep the conversation moving.</h1>
        <p>Share a training goal, ask a question or connect with other members.</p>
      </div>
    </section>
    <section class="section">
      <div class="container community-layout">
        <div><span class="eyebrow">Member discussion</span>
          <h2>On and off the mat.</h2>
          <div id="post-list" class="posts" aria-live="polite">
            <p class="empty">Loading posts…</p>
          </div>
          <button class="button ghost small" id="posts-retry" type="button" hidden>Try again</button>
        </div>
        <aside>
          <div id="community-guest" class="form-card">
            <h3>Join the conversation</h3>
            <p>Create an account or sign in to add a post.</p><a class="button dark"
              href="/login.html?next=community">Sign in to post</a>
          </div>
          <form id="post-form" class="form-card" hidden>
            <h3>Write a post</h3>
            <div class="field"><label for="post-text">Your message</label><textarea id="post-text" maxlength="500"
                minlength="4" required placeholder="What are you working on this week?"></textarea><small>Be kind and
                keep personal information private. 500 characters maximum.</small></div><button class="button dark"
              type="submit">Publish post</button>
            <p class="form-message" role="status" aria-live="polite"></p>
          </form>
        </aside>
      </div>
    </section>
'''),

"contact": ("Contact DoBu", "Send a message to the DoBu Martial Arts team.", page_hero("Get in touch", "Have a question?", "Ask about classes, membership options or training with our team.") + '''
<section class="section"><div class="container auth-shell"><div class="auth-side"><span class="eyebrow light">Let's talk</span><h2>Start a conversation.</h2><p>Looking for a suitable class or want to know which plan matches your schedule? Send a message with your question.</p><p><strong>Before you message</strong><br>Check the <a href="/timetable.html" class="underlined">timetable</a> and <a href="/pricing.html" class="underlined">pricing</a> for the details in the assignment brief.</p></div><form id="contact-form" class="form-card"><h2>Send an enquiry</h2><div class="form-grid"><div class="field"><label for="contact-name">Name</label><input id="contact-name" name="name" autocomplete="name" required minlength="2" maxlength="60"></div><div class="field"><label for="contact-email">Email</label><input id="contact-email" name="email" type="email" autocomplete="email" required maxlength="120"></div></div><div class="field"><label for="contact-message">Message</label><textarea id="contact-message" name="message" required minlength="10" maxlength="1500" placeholder="How can we help?"></textarea></div><button class="button dark" type="submit">Save enquiry</button><p class="form-message" role="status" aria-live="polite"></p><p class="fine-print">This assignment demo stores your enquiry locally on the server. It does not send email.</p></form></div></section>
'''),

"login": ('Sign in or register', 'Create a DoBu Martial Arts member account or sign in.', '''
<!-- =====================================
         HERO SECTION
    ====================================== -->

    <section class="page-hero">

      <div class="container">

        <span class="eyebrow light">
          Member access
        </span>

        <h1>
          Your next chapter starts here.
        </h1>

        <p>
          Sign in or create an account to save a plan
          preference and join the community.
        </p>

      </div>

    </section>


    <!-- =====================================
         LOGIN / REGISTER SECTION
    ====================================== -->

    <section class="section">

      <div class="container auth-shell">


        <!-- =====================================
             MEMBER BENEFITS
        ====================================== -->

        <div class="auth-side">

          <span class="eyebrow light">
            Member benefits
          </span>

          <h2>
            More than a login.
          </h2>

          <ul class="checks">

            <li>
              Save a membership preference
            </li>

            <li>
              Change or clear your choice at any time
            </li>

            <li>
              Join the member discussion
            </li>

          </ul>

          <p>
            Account creation is for this assignment
            demonstration. No payments are collected.
          </p>

        </div>


        <!-- =====================================
             FORM CARD
        ====================================== -->

        <div class="form-card">


          <!-- =====================================
               TABS
          ====================================== -->

          <div
            class="tabs"
            role="tablist"
            aria-label="Member access"
          >

            <button
              type="button"
              id="login-tab"
              data-tab="login"
              role="tab"
              aria-selected="true"
              aria-controls="login-form"
            >
              Sign in
            </button>


            <button
              type="button"
              id="register-tab"
              data-tab="register"
              role="tab"
              aria-selected="false"
              aria-controls="register-form"
            >
              Create account
            </button>

          </div>


          <!-- =====================================
               LOGIN FORM
          ====================================== -->

          <form
            id="login-form"
            role="tabpanel"
            aria-labelledby="login-tab"
            novalidate
          >

            <h2>
              Welcome back.
            </h2>


            <!-- Login Email -->

            <div class="field">

              <label for="login-email">
                Email
              </label>

              <input
                id="login-email"
                name="email"
                type="email"
                autocomplete="email"
                maxlength="120"
                aria-describedby="login-email-error"
                required
              >

              <small
                class="field-error"
                id="login-email-error"
                aria-live="polite"
              ></small>

            </div>


            <!-- Login Password -->

            <div class="field">

              <label for="login-password">
                Password
              </label>

              <input
                id="login-password"
                name="password"
                type="password"
                autocomplete="current-password"
                maxlength="128"
                aria-describedby="login-password-error"
                required
              >

              <small
                class="field-error"
                id="login-password-error"
                aria-live="polite"
              ></small>

            </div>


            <button
              class="button dark"
              type="submit"
            >
              Sign in
            </button>


            <p
              class="form-message"
              id="login-message"
              role="status"
              aria-live="polite"
            ></p>

          </form>


          <!-- =====================================
               REGISTER FORM
          ====================================== -->

          <form
            id="register-form"
            role="tabpanel"
            aria-labelledby="register-tab"
            novalidate
            hidden
          >

            <h2>
              Join DoBu.
            </h2>


            <!-- Name -->

            <div class="field">

              <label for="register-name">
                Name
              </label>

              <input
                id="register-name"
                name="name"
                type="text"
                autocomplete="name"
                minlength="2"
                maxlength="60"
                aria-describedby="register-name-error"
                required
              >

              <small
                class="field-error"
                id="register-name-error"
                aria-live="polite"
              ></small>

            </div>


            <!-- Email -->

            <div class="field">

              <label for="register-email">
                Email
              </label>

              <input
                id="register-email"
                name="email"
                type="email"
                autocomplete="email"
                maxlength="120"
                aria-describedby="register-email-error"
                required
              >

              <small
                class="field-error"
                id="register-email-error"
                aria-live="polite"
              ></small>

            </div>


            <!-- Password -->

            <div class="field">

              <label for="register-password">
                Password
              </label>

              <input
                id="register-password"
                name="password"
                type="password"
                autocomplete="new-password"
                minlength="10"
                maxlength="128"
                aria-describedby="password-help register-password-error"
                required
              >

              <small id="password-help">
                Use at least 10 characters.
              </small>

              <small
                class="field-error"
                id="register-password-error"
                aria-live="polite"
              ></small>

            </div>


            <!-- Confirm Password -->

            <div class="field">

              <label for="register-confirm">
                Confirm password
              </label>

              <input
                id="register-confirm"
                name="confirm"
                type="password"
                autocomplete="new-password"
                minlength="10"
                maxlength="128"
                aria-describedby="register-confirm-error"
                required
              >

              <small
                class="field-error"
                id="register-confirm-error"
                aria-live="polite"
              ></small>

            </div>


            <button
              class="button dark"
              type="submit"
            >
              Create account
            </button>


            <p
              class="form-message"
              id="register-message"
              role="status"
              aria-live="polite"
            ></p>

          </form>

        </div>

      </div>

    </section>
'''),
}


def layout(slug, title, description, content):
    nav = "\n".join(f'<a href="/{href}"' + (' aria-current="page"' if href == f"{slug}.html" else "") + f'>{label}</a>' for href, label in NAV)
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{escape(description, quote=True)}">
  <meta name="theme-color" content="#0b1c1c">
  <title>{escape(title)} | DoBu Martial Arts</title>
  <link rel="icon" href="/assets/logo.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/css/styles.css?v=1.2.1">
  <script src="/js/app.js?v=1.2.1" defer></script>
</head>
<body data-page="{slug}">
<a class="skip-link" href="#main">Skip to main content</a>
<header class="site-header"><div class="container header-inner">
  <a class="brand" href="/index.html" aria-label="DoBu Martial Arts home"><img src="/assets/logo.svg" alt="" width="40" height="40"><span>DO<span>BU</span> <small class="brand-subtitle">MARTIAL ARTS</small></span></a>
  <button class="menu-toggle" id="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav">Menu ☰</button>
  <nav class="main-nav" id="main-nav" aria-label="Primary navigation">{nav}<a href="/login.html" class="nav-action" data-account-link>Join now</a></nav>
</div></header>
<main id="main">{content}</main>
<footer class="footer"><div class="container"><div class="footer-grid">
  <div><a class="brand" href="/index.html"><img src="/assets/logo.svg" alt="" width="40" height="40"><span>DO<span>BU</span> MARTIAL ARTS</span></a><p>Martial arts, fitness and a welcoming place to grow. Built as a website development assignment demonstration.</p></div>
  <div><h3>Explore</h3><a href="/classes.html">Classes</a><a href="/timetable.html">Timetable</a><a href="/pricing.html">Memberships &amp; pricing</a><a href="/trainers.html">Our coaches</a></div>
  <div><h3>Connect</h3><a href="/about.html">About us</a><a href="/community.html">Community</a><a href="/contact.html">Contact</a><a href="/membership.html">Member area</a></div>
</div><div class="footer-bottom"><span>© DoBu Martial Arts • Assignment demonstration</span><span>Train with purpose. Grow together.</span></div></div></footer>
</body></html>
'''


if __name__ == "__main__":
    for slug, (title, description, content) in PAGES.items():
        (ROOT / f"{slug}.html").write_text(layout(slug, title, description, content), encoding="utf-8")
    print(f"Generated {len(PAGES)} pages in {ROOT}")
