Corwin Lee Portfolio Page

## Local development
- Install dependencies: `npm ci`
- Run dev server: `npm start`
- Build static site: `npm run build`

## Deployment
- Pushes to `main` trigger the GitHub Actions workflow at `.github/workflows/deploy.yml`
- The workflow builds the Eleventy site and deploys the `_site` output to GitHub Pages
- Live site: https://ckwlee.github.io
