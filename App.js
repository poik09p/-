/* GLOBAL STATE */
let userData={weight:0,height:0,age:0,gender:"male",activity:1.2,goal:"maintain",challengeDays:10,targetCalories:0,targetProtein:0,targetCarbs:0,targetFat:0};
let meals=[],exercises=[];
let totals={calories:0,protein:0,carbs:0,fat:0};

/* DOM */
const mealListEl=document.getElementById("mealList");
const remainingCaloriesEl=document.getElementById("remainingCalories");
const progressBar=document.getElementById("progressBar");

/* CIRCULAR PROGRESS */
const calorieCircle = document.getElementById("calorieProgress");
const calorieText = document.getElementById("calorieText");
const circleProtein = document.getElementById("circleProtein");
const circleCarbs = document.getElementById("circleCarbs");
const circleFat = document.getElementById("circleFat");

/* THEME */
document.getElementById("toggleMode").addEventListener("click",()=>{
  document.body.classList.toggle("dark");
  localStorage.setItem("theme",document.body.classList.contains("dark")?"dark":"light");
});
if(localStorage.getItem("theme")==="dark") document.body.classList.add("dark");

/* WIZARD */
const wizard=document.getElementById("wizard");
const questionTitle=document.getElementById("questionTitle");
const answerOptions=document.getElementById("answerOptions");
const nextBtn=document.getElementById("nextBtn");

const questions=[
  {question:"ما وزنك؟",options:["40-50","51-60","61-70","71+"]},
  {question:"ما طولك؟",options:["140-150","151-160","161-170","171+"]},
  {question:"ما عمرك؟",options:["10-15","16-20","21-30","31+"]},
  {question:"ما هدفك؟",options:["خسارة وزن","زيادة وزن","تثبيت وزن"]}
];

let currentStep=0;
let userAnswers=[];

function renderStep(step){
  questionTitle.textContent = questions[step].question;
  answerOptions.innerHTML = "";
  questions[step].options.forEach(opt=>{
    const div=document.createElement("div");
    div.classList.add("answer-card");
    div.innerHTML=`<span>${opt}</span>`;
    div.onclick = ()=> selectAnswer(div,opt);
    answerOptions.appendChild(div);
  });
}

function selectAnswer(div,answer){
  document.querySelectorAll(".answer-card").forEach(c=>c.classList.remove("selected"));
  div.classList.add("selected");
  userAnswers[currentStep] = answer;
  nextBtn.style.display = "block";
}

nextBtn.onclick = ()=>{
  nextBtn.style.display = "none";
  currentStep++;
  if(currentStep < questions.length) renderStep(currentStep);
  else{
    wizard.innerHTML="<h2>تم تسجيل إجاباتك بنجاح! 🎉</h2>";
    mapAnswersToUserData();
    calculateTargets();
  }
}

function mapAnswersToUserData(){
  userData.weight=parseInt(userAnswers[0].split("-")[1]);
  userData.height=parseInt(userAnswers[1].split("-")[1]);
  userData.age=parseInt(userAnswers[2].split("-")[0]);
  userData.goal=userAnswers[3];
}

renderStep(currentStep);

/* CALCULATIONS */
function calculateBMR(){
  return userData.gender==="male" ? 10*userData.weight+6.25*userData.height-5*userData.age+5 : 10*userData.weight+6.25*userData.height-5*userData.age-161;
}

function calculateTargets(){
  let calories=calculateBMR()*userData.activity;
  if(userData.goal==="خسارة وزن") calories-=500;
  if(userData.goal==="زيادة وزن") calories+=500;
  userData.targetCalories=Math.round(calories);
  userData.targetProtein=Math.round(userData.weight*2);
  userData.targetFat=Math.round((calories*0.25)/9);
  userData.targetCarbs=Math.round((calories-userData.targetProtein*4-userData.targetFat*9)/4);
}

/* MEALS */
document.getElementById("addMealBtn").addEventListener("click",()=>{
  const name=document.getElementById("mealName").value;
  const calories=Number(document.getElementById("mealCalories").value);
  const protein=Number(document.getElementById("mealProtein").value);
  const carbs=Number(document.getElementById("mealCarbs").value);
  const fat=Number(document.getElementById("mealFat").value);
  if(!name||calories<=0) return;
  meals.push({id:Date.now(),name,calories,protein,carbs,fat});
  recalcTotals();
  renderMeals();
});

function renderMeals(){
  mealListEl.innerHTML="";
  meals.forEach(m=>{
    const li=document.createElement("li");
    li.innerHTML=`<span>${m.name} - ${m.calories} kcal</span><button onclick="deleteMeal(${m.id})">❌</button>`;
    mealListEl.appendChild(li);
  });
}

function deleteMeal(id){ meals=meals.filter(m=>m.id!==id); recalcTotals(); renderMeals(); }

/* EXERCISES */
document.getElementById("addExerciseBtn").addEventListener("click",()=>{
  const name=document.getElementById("exerciseName").value;
  const calories=Number(document.getElementById("exerciseCalories").value);
  if(!name||calories<=0) return;
  exercises.push({id:Date.now(),name,calories});
  recalcTotals();
});

/* TOTALS */
function recalcTotals(){
  totals={calories:0,protein:0,carbs:0,fat:0};
  meals.forEach(m=>{ totals.calories+=m.calories; totals.protein+=m.protein; totals.carbs+=m.carbs; totals.fat+=m.fat; });
  exercises.forEach(e=>{ totals.calories-=e.calories; });
  updateProgress();
  updateCircularProgress();
}

/* PROGRESS */
function updateProgress(){
  const remaining=userData.targetCalories-totals.calories;
  remainingCaloriesEl.textContent=remaining;
  let percent=(totals.calories/userData.targetCalories)*100;
  percent=Math.min(100,Math.max(0,percent));
  progressBar.value=percent;
}

/* CIRCULAR PROGRESS */
function updateCircularProgress(){
  const target=userData.targetCalories;
  const consumed=totals.calories;
  const percent=Math.min(consumed/target,1);
  const circumference=2*Math.PI*90;
  const offset=circumference*(1-percent);
  calorieCircle.style.strokeDashoffset=offset;
  calorieText.textContent=`${consumed} kcal`;
  circleProtein.textContent=totals.protein;
  circleCarbs.textContent=totals.carbs;
  circleFat.textContent=totals.fat;
}

/* CAMERA AI */
const aiBtn=document.getElementById("aiMealBtn");
const cameraSection=document.getElementById("cameraSection");
const video=document.getElementById("video");
const canvas=document.getElementById("canvas");
const snapBtn=document.getElementById("snapBtn");
const closeCamera=document.getElementById("closeCamera");

aiBtn.addEventListener("click", async ()=>{
  cameraSection.style.display="block";
  wizard.style.display="none";
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:false});
    video.srcObject=stream;
  }catch(err){
    alert("لم نتمكن من الوصول للكاميرا: "+err);
  }
});

snapBtn.addEventListener("click",()=>{
  canvas.width=video.videoWidth;
  canvas.height=video.videoHeight;
  canvas.getContext("2d").drawImage(video,0,0);
  const imageData=canvas.toDataURL("image/png");
  alert("تم التقاط الصورة!");
});

closeCamera.addEventListener("click", ()=>{
  cameraSection.style.display="none";
  wizard.style.display="block";
  let stream=video.srcObject;
  if(stream){ stream.getTracks().forEach(track=>track.stop()); video.srcObject=null; }
});
