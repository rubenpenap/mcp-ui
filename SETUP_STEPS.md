# Setup Steps

1. Find/replace the subtitle of the workshop from "Go beyond text interaction in AI Chat" to "Your
   subtitle" (this will appear on the top of the README as well as on the
   `og:image` when shared on social media)
1. Update the workshop summary in the `README.md`
1. Update the Prerequisites, pre-workshop resources, and if necessary system
   requirements in the `README.md`
1. Update `epicshop.instructor` and `author` properties in `package.json`
1. Update the `public/images/instructor.png` with your own image
1. Update all dependencies
   ```sh
   ./epicshop/update-deps.sh
   ```
1. Ask Kent to create a Fly app for your workshop to deploy to. Just tell him
   what it's called in the `epicshop/fly.toml`. No need to wait on Kent for this
   step, just let him know and continue to the next step, he'll get to it soon.
1. Initialize git and create a github repo on `epicweb-dev` with the name you
   chose

And as the last step, delete this file, create your initial commit, push it, and
start working on your exercises!
