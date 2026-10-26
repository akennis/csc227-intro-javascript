# CSC 227 Labs — my submissions

This is your personal repository for CSC 227 lab work. Your instructor grades the
code you submit here and reviews it on your pull requests.

## Setup (once)

1. Create your own repository from this template (on GitHub: **Use this template →
   Create a new repository**), or copy this folder into a new repo. It can be
   public (part of your portfolio) or private and shared with your instructor.
2. Fill in `student.json` with your name and GitHub username.
3. Give your instructor the repository URL (they add it to their roster).
4. Clone it to your computer:

   ```bash
   git clone https://github.com/<you>/<your-repo>.git
   cd <your-repo>
   ```

## Submitting a lab (as a pull request)

1. Open the lab page, e.g. `.../labs/lab.html?id=lab-02`.
2. Solve each problem and press **▶ Run & check** until its tests are green.
3. Press **📋 Copy submission**.
4. Start a branch for this lab — always from an up-to-date `main`:

   ```bash
   git checkout main
   git pull
   git checkout -b lab-02
   ```

5. Save the copied text as `submissions/lab-02.js` (the id is shown on the lab page).
6. Commit, push, and open a pull request:

   ```bash
   git add submissions/lab-02.js
   git commit -m "Lab 02"
   git push -u origin lab-02
   gh pr create --fill          # or open the PR on github.com
   ```

7. Add your instructor as a reviewer.

## Responding to review comments

Your instructor comments on the pull request: correctness first, structure second,
style last. For each comment, either make the change, make a different change and
explain why, or reply explaining why you disagree (that's allowed — push back with
reasons). To update the pull request, edit the file, then:

```bash
git add submissions/lab-02.js
git commit -m "Address review comments"
git push
```

Once you get an **Approval**, merge the pull request (squash), delete the branch, and
update your local copy:

```bash
git checkout main
git pull
```

## Rules

- **Keep the header lines and the `// ===== problem N =====` markers** in each
  submission file. They tell the grader which lab and which problem each part answers.
- One file per lab, named exactly `submissions/<lab-id>.js`.
- Re-submitting is just editing the same file and pushing again — the latest version
  on your pull request (or on `main`, once merged) is graded.
