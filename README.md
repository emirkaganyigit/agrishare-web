<div align="center">

# 🌱 AGRISHARE

### An Intelligent Agricultural Land Sharing Platform

**Connecting landowners and agricultural entrepreneurs through technology, data, and AI-powered decision support.**

Agricultural Land Marketplace • Climate Intelligence • Soil Analysis • Financial Simulation • AI Advisory

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss)
![Status](https://img.shields.io/badge/Status-Active_Development-orange)

[Overview](#overview) •
[Features](#features) •
[Technology Stack](#technology-stack) •
[Installation](#installation) •
[Architecture](#system-architecture) •
[Roadmap](#roadmap)

</div>

---

## Overview

**Agrishare** is a web-based agricultural land sharing and decision-support platform designed to connect landowners with individuals and organizations interested in agricultural production.

The project aims to help bring unused or underutilized agricultural land into productive use by combining a digital land marketplace with climate intelligence, soil information, financial modeling, and artificial intelligence.

Agrishare is more than a listing platform. Its long-term vision is to build an integrated ecosystem where users can discover agricultural opportunities, evaluate production scenarios, communicate with landowners, and make more informed decisions.

### The Problem

Agricultural land may remain unused or underutilized because of:

- Limited access to suitable land.
- Difficulties connecting landowners with agricultural entrepreneurs.
- Insufficient access to localized agricultural information.
- Uncertainty about production costs and potential revenue.
- Limited access to analytical and decision-support tools.

### Our Approach

Agrishare brings together:

1. An agricultural land marketplace.
2. Landowner and entrepreneur communication tools.
3. Geospatial land information.
4. Historical climate analysis.
5. Soil data management.
6. Crop comparison and screening.
7. Agricultural financial simulation.
8. AI-assisted agricultural evaluation.

> **Project status:** Agrishare is currently an actively developed MVP (Minimum Viable Product). Several agricultural and financial models are experimental and require further validation before production use.

---

## Features

### 1. Authentication and User Management

Agrishare uses Supabase Authentication for account management.

Features include:

- Email and password authentication.
- User registration and login.
- Session management.
- Personal user dashboard.
- Profile management.
- Landowner and agricultural entrepreneur roles.

User profile information is currently private to the account owner.

### 2. Agricultural Land Marketplace

Landowners can create and manage agricultural property listings.

Supported functionality:

- Create land listings.
- Upload land photographs.
- Edit listing information.
- Archive and reactivate listings.
- Browse available land.
- Filter listings by location and listing type.
- View detailed land information.
- Explore approximate land locations on a map.

Supported listing types:

| Listing Type | Description |
|---|---|
| Rental | Agricultural land available for rent |
| Sale | Agricultural land offered for sale |
| Joint Production | Land offered for agricultural collaboration |

### 3. Offers and Messaging

Agrishare enables communication between landowners and interested users.

Features include:

- Submit offers for listed land.
- Review received offers.
- Track submitted offers.
- Accept or reject offers.
- Exchange private messages.
- Receive updates through Supabase Realtime.

Access to offers and conversations is restricted through database-level authorization policies.

An accepted offer does not automatically constitute a legally binding agreement.

### 4. Interactive Land Mapping

Agrishare integrates MapLibre GL JS to provide interactive land maps.

Users can:

- Select an approximate land location.
- Explore land positions on a map.
- View geographic information in listing details.
- Associate coordinates with agricultural analysis.

Coordinates are stored at approximately two decimal places of precision.

This location information is intended for regional analysis rather than identifying exact property boundaries.

### 5. Historical Climate Intelligence

Climate information is retrieved from the Open-Meteo Historical Weather API.

Supported indicators include:

- Average temperature.
- Annual precipitation.
- Monthly temperature patterns.
- Monthly precipitation patterns.
- Historical frost-day statistics.

The application analyzes the three most recently completed calendar years.

**Important:** Historical climate data does not represent a future weather forecast or an exact measurement of conditions within an individual land parcel.

### 6. Agricultural Financial Simulator

The financial simulator allows users to explore agricultural production scenarios.

Inputs include:

- Agricultural land area.
- Crop selection.
- Expected yield.
- Estimated selling price.
- Production costs.
- Rental expenses.
- Fixed annual expenses.
- Initial investment costs.

Calculated outputs include:

- Estimated production volume.
- Gross revenue.
- Total annual costs.
- Annual operating result.
- First-year net result.
- Break-even selling price.
- Operating margin.

The simulator supports three scenarios:

| Scenario | General Assumption |
|---|---|
| Pessimistic | Lower yields and prices, higher production costs |
| Base | User-defined baseline assumptions |
| Optimistic | Higher yields and prices under alternative cost assumptions |

Initial crop options:

- Wheat
- Chickpea
- Sunflower

The default yield, price, and cost values are illustrative assumptions rather than verified live market data.

### 7. AI Agricultural Advisor

Agrishare includes an AI-powered agricultural advisory interface using the Groq API.

The advisor combines:

- Land information.
- Historical climate indicators.
- Crop selection.
- Example financial scenarios.
- Available soil information.
- User questions.

It generates Turkish-language assessments covering:

- Land and climate considerations.
- Crop-specific opportunities and constraints.
- Financial scenario interpretation.
- Missing information and uncertainty.
- Pre-production recommendations and checks.

Current default model:

`openai/gpt-oss-20b`

The model is accessed through Groq's API.

To limit resource usage, the application implements a database-backed request quota.

AI-generated content is intended to support user understanding and does not replace professional agricultural consultation.

### 8. Crop–Land Screening

Agrishare compares selected crops using available climate and soil information.

The initial screening model supports:

- Wheat.
- Chickpea.
- Sunflower.

Climate indicators:

- Seasonal average temperature.
- Seasonal precipitation.

Soil indicators:

- Soil pH.
- Electrical conductivity (ECe).
- Soil texture.
- Drainage conditions.

The experimental climate screening index uses:

```text
Climate Index =
(Temperature Score × 0.50) +
(Precipitation Score × 0.50)
```

When all required soil indicators are available, an experimental combined index can be calculated:

```text
Combined Index =
(Climate Index × 0.60) +
(Soil Index × 0.40)
```

These formulas represent prototype screening rules.

**The resulting scores are not validated crop suitability percentages, yield forecasts, or probabilities of agricultural success.**

### 9. Soil Analysis Management

Landowners can provide soil information for their properties.

Supported fields:

- Soil pH.
- Electrical conductivity of the saturation extract (ECe, dS/m).
- Organic matter percentage.
- Soil texture.
- Drainage condition.
- Soil sampling date.

Soil data is stored in Supabase and associated with the relevant land listing.

Currently, soil measurements are provided by users and are not independently verified by Agrishare.

### 10. Comprehensive Land Reports

Agrishare combines agricultural indicators into an integrated land evaluation report.

Reports can include:

1. Land information.
2. Historical climate summary.
3. Soil measurements.
4. Crop screening comparison.
5. Financial scenarios.
6. Identified risks and missing information.
7. Optional AI-generated interpretation.

Reports can be saved as PDF files through the browser's print functionality.

---

## Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| Next.js 16 | Application framework |
| React | Component-based user interfaces |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Lucide React | Icon library |
| Recharts | Data visualization |
| MapLibre GL JS | Interactive mapping |

### Backend and Database

| Technology | Purpose |
|---|---|
| Next.js Route Handlers | Server-side API endpoints |
| Supabase Auth | Authentication |
| PostgreSQL | Relational database |
| Supabase Row Level Security | Access control |
| Supabase Storage | Land image storage |
| Supabase Realtime | Messaging and offer updates |

### External Services

| Service | Purpose |
|---|---|
| Open-Meteo | Historical weather and climate data |
| Groq | LLM inference |
| OpenStreetMap | Map tiles during development |

---

## System Architecture

```text
                       AGRISHARE
                           |
                    Next.js App Router
                           |
             +-------------+-------------+
             |                           |
         React UI                   API Routes
             |                           |
      +------+------+             +------+------+
      |             |             |             |
 Land Listings   Analytics    Climate API   AI Advisor
      |             |             |             |
      +------+------+             |             |
             |                    |             |
          Supabase             Open-Meteo       Groq
             |
      +------+-------+
      |      |       |
   Auth   Database  Storage
             |
             RLS
```

### Data Flow

1. Users authenticate through Supabase Auth.
2. Land information is stored in PostgreSQL.
3. Row Level Security controls access to protected records.
4. Approximate land coordinates are used to request historical climate data.
5. Climate and soil information is processed by screening modules.
6. The financial simulator calculates production scenarios.
7. The AI advisor can interpret selected outputs.
8. Results are presented through interactive pages and land reports.

---

## Project Structure

```text
agrishare-web/
├── public/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── climate/
│   │   │   └── ai-advisor/
│   │   ├── araziler/
│   │   ├── ilan-ver/
│   │   ├── giris/
│   │   ├── profil/
│   │   ├── panel/
│   │   ├── teklifler/
│   │   ├── analiz/
│   │   ├── simulasyon/
│   │   ├── danisman/
│   │   ├── eslestirme/
│   │   └── rapor/
│   ├── components/
│   └── lib/
│       ├── supabase.ts
│       ├── lands.ts
│       ├── simulation.ts
│       ├── cropSuitability.ts
│       ├── soilScreening.ts
│       └── visibleLands.ts
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── next.config.ts
└── README.md
```

The structure may change as the project evolves.

---

## Installation

### Prerequisites

You will need:

- Node.js compatible with Next.js 16.
- npm.
- Git.
- A Supabase project.
- A Groq API key for AI functionality.

### 1. Clone the Repository

```bash
git clone https://github.com/emirkaganyigit/agrishare-web.git

cd agrishare-web
```

### 2. Install Dependencies

```bash
npm ci
```

### 3. Configure Environment Variables

Create a local environment file:

```bash
cp .env.example .env.local
```

Example configuration:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY

GROQ_API_KEY=YOUR_GROQ_API_KEY
GROQ_MODEL=openai/gpt-oss-20b

NEXT_PUBLIC_ENABLE_DEMO_LANDS=false
```

Replace placeholder values with credentials from your own accounts.

Never commit `.env.local` or expose the Groq API key through a `NEXT_PUBLIC_` environment variable.

### 4. Set Up Supabase

Create a project at:

https://supabase.com/dashboard

The application uses the following database tables:

| Table | Purpose |
|---|---|
| `lands` | Agricultural land listings |
| `offers` | Offers submitted by users |
| `offer_messages` | Private offer conversations |
| `land_soil_profiles` | Soil information |
| `profiles` | User profiles |
| `ai_request_usage` | AI usage limits |

Supabase Storage also requires a bucket named:

`land-photos`

**Database setup limitation:** The application was initially developed through SQL scripts executed in the Supabase SQL Editor. A complete version-controlled migration system has not yet been added.

A new Supabase project requires the necessary schema, RLS policies, storage configuration, and database functions before every feature will work.

Creating reproducible migrations is a priority in the roadmap.

### 5. Run the Development Server

```bash
npm run dev
```

Open:

http://localhost:3000

### 6. Run TypeScript Checks

```bash
npx tsc --noEmit
```

### 7. Build for Production

```bash
npm run build
```

After a successful build:

```bash
npm run start
```

---

## Application Routes

| Route | Description |
|---|---|
| `/` | Homepage |
| `/araziler` | Land marketplace |
| `/araziler/[id]` | Land details |
| `/ilan-ver` | Create listing |
| `/giris` | Authentication |
| `/panel` | User dashboard |
| `/profil` | Profile management |
| `/teklifler` | Offers |
| `/teklifler/[id]` | Private conversation |
| `/analiz` | Agricultural analysis dashboard |
| `/simulasyon` | Financial simulator |
| `/danisman` | AI agricultural advisor |
| `/eslestirme` | Crop–land screening |
| `/rapor` | Comprehensive land report |

Additional routes support listing editing and soil profile management.

---

## API Reference

### Historical Climate API

```http
GET /api/climate?lat=38.42&lon=27.14
```

Returns a historical climate summary for the supplied coordinates.

Response fields include:

```text
period
averageTemperature
annualPrecipitation
frostDaysPerYear
monthly
source
```

Data is retrieved from Open-Meteo and processed by the application.

### AI Advisor API

```http
POST /api/ai-advisor
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
Content-Type: application/json
```

Example request:

```json
{
  "landId": "00000000-0000-0000-0000-000000000000",
  "crop": "bugday",
  "question": "What climate and financial risks should be considered for this crop?"
}
```

The example UUID is a placeholder. A real, accessible land listing ID is required.

The endpoint:

1. Validates the user's Supabase access token.
2. Retrieves the selected land.
3. Obtains historical climate information.
4. Calculates financial scenarios.
5. Applies usage limits.
6. Requests an AI-generated assessment from Groq.

The current application quota allows up to five AI analyses per user within a rolling 24-hour period, with a minimum interval between requests.

Provider-level quotas also apply.

---

## Security

Agrishare uses Supabase Authentication and PostgreSQL Row Level Security.

Core security controls include:

- Authenticated listing creation.
- Owner-restricted listing modifications.
- Restricted offer access.
- Participant-only messaging.
- Private user profiles.
- Owner-restricted soil data modifications.
- Server-side AI API keys.
- Database-backed AI usage limits.

Security testing remains an ongoing development priority.

### Important Security Considerations

Before launching the application publicly, additional work is needed:

- Comprehensive RLS authorization tests.
- File upload validation.
- Abuse and spam prevention.
- Rate limiting across relevant endpoints.
- Error handling and logging reviews.
- Authentication configuration review.
- Security testing with multiple user accounts.

---

## Agricultural and Financial Model Limitations

Agrishare currently provides experimental decision-support functionality.

### Climate

Historical weather data does not guarantee future growing conditions.

### Soil

Soil information is user-provided and may not be independently verified.

### Crop Screening

The scoring methodology contains experimental assumptions and has not been calibrated as a validated agronomic suitability model.

### Financial Simulation

Default crop yields, selling prices, and production costs are illustrative inputs.

### Artificial Intelligence

AI-generated assessments may be incomplete or inaccurate and should be reviewed before operational decisions.

The platform does not replace professional agricultural, legal, or financial advice.

---

## Roadmap

### Completed MVP Modules

- [x] Next.js application foundation
- [x] Supabase authentication
- [x] Agricultural land listings
- [x] Photo upload
- [x] Offer management
- [x] Private messaging
- [x] Listing editing and archiving
- [x] Interactive maps
- [x] Historical climate analysis
- [x] Agricultural financial simulator
- [x] Groq AI advisor
- [x] Preliminary crop–land screening
- [x] Soil data management
- [x] Comprehensive land reports
- [x] User profile management

### Engineering Priorities

- [ ] Reproducible database migrations
- [ ] Unit and integration tests
- [ ] Automated RLS authorization tests
- [ ] GitHub Actions CI
- [ ] Reliable production build verification
- [ ] Responsive UI improvements
- [ ] Accessibility testing
- [ ] Performance optimization
- [ ] Monitoring and error reporting
- [ ] Production deployment

### Agricultural Intelligence

- [ ] Verified regional crop information
- [ ] Real agricultural market price integrations
- [ ] Regional planting calendars
- [ ] Advanced water requirement modeling
- [ ] Improved soil data interpretation
- [ ] Agronomically validated crop suitability models
- [ ] More comprehensive production cost analysis

### Marketplace

- [ ] Public landowner profiles
- [ ] Enhanced location-based search
- [ ] Persistent user favorites
- [ ] Notification system
- [ ] Listing moderation
- [ ] User verification workflows
- [ ] Improved partnership workflows

---

## Development Workflow

The project uses Git for version control.

During the current solo-development stage, changes may be committed directly to the default branch.

Recommended checks before committing code changes:

```bash
npx tsc --noEmit
npm run build
```

Example commit:

```bash
git add .
git commit -m "feat: add new functionality"
git push
```

Recommended commit conventions:

| Prefix | Purpose |
|---|---|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `refactor:` | Code restructuring |
| `security:` | Security improvements |
| `docs:` | Documentation |
| `test:` | Automated tests |
| `style:` | UI and styling changes |

Feature branches and pull requests can be introduced as the project grows.

---

## References

### Technical Documentation

- [Next.js](https://nextjs.org/docs)
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Supabase](https://supabase.com/docs)
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- [Recharts](https://recharts.org)
- [Groq API](https://console.groq.com/docs)
- [Open-Meteo](https://open-meteo.com/en/docs)

### Agricultural References

- [FAO](https://www.fao.org/)
- [Turkish Statistical Institute](https://www.tuik.gov.tr/)
- [Republic of Türkiye Ministry of Agriculture and Forestry](https://www.tarimorman.gov.tr/)

These references do not imply that all experimental Agrishare calculations have been independently validated by the listed organizations.

---

## License

A software license has not yet been selected for this repository.

Third-party libraries, APIs, map services, and datasets remain subject to their respective licenses and terms of use.

Commercial deployment will require a review of relevant data provider and map tile usage conditions.

---

## Developer

**[emirkaganyigit](https://github.com/emirkaganyigit)**

Repository: [agrishare-web](https://github.com/emirkaganyigit/agrishare-web)

---

<div align="center">

### 🌾 AGRISHARE

**Connecting Land, Agriculture, and Technology.**

Built to support a more accessible, informed, and collaborative agricultural ecosystem.

**Active Development — MVP**

</div>
