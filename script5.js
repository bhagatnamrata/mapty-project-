'use strict';



const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
//using geolocation API to find current location cordinates
// let map;
// let mapEvent;

class Workout {//parent class of running and cycling
    date = new Date();//date is need 
    id = (Date.now() + '').slice(-10);
    clicks=0;

    constructor(coords, distance, duration) {
        // this.date =...
        this.coords = coords;
        this.distance = distance;//in Km
        this.duration = duration;//inmin
        // this._setDescription();//it should be in child class there is type variable defined 
    }
    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
    click(){
        this.clicks++;
    }

}
class Running extends Workout {
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this.type = 'running';
        this._setDescription();
    }

    calcPace() {
        // min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
class Cycling extends Workout {
    constructor(coords, distance, duration, elevationgain) {
        super(coords, distance, duration);
        this.elevationgain = elevationgain;
        this.calcSpeed();
        this.type = 'cycling';
        this._setDescription();
    }

    calcSpeed() {
        // km/h
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}
const run1 = new Running([55, 27.33], 5, 24, 150);
const cyc1 = new Cycling([55, 27.33], 5, 24, 150);
console.log(run1, cyc1);

////////////////////////////////////////
//Application Architecture
class App {
    #map;
    #mapZoomLevel=13;
    #mapEvent;
    #workouts = [];
    constructor() {
        // this.workouts=[];

        //get user position
        this._getPosition();
        
        //get data from local storage
        this._getLocalStorage();

        //attach event handlers
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField
        );
        containerWorkouts.addEventListener('click',this._moveToPopup.bind(this));
    }

    _getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
                alert('Unable to get your position ,Please turn on  your  location')
            });
    }

    _loadMap(position) {

        console.log(position);
        const { latitude } = position.coords;//destructuring
        const { longitude } = position.coords;
        console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

        const coords = [latitude, longitude];

        //pasting code from leaflet library to get map 
        console.log(this);
        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);//map object 

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);

        //handling clicks on map
        this.#map.on('click',
            this._showForm.bind(this));

            this.#workouts.forEach(work=>{
                this._renderWorkoutMarker(work)
            });
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }
    _hideForm() {
        //after sumiting /pressing enter input fields get clear 
        inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';
        form.style.display = 'none'
        form.classList.add('hidden');
        //using only hidden formlist  just scroll to up we dont want that we want quickly get disappear and replace by list
        setTimeout(()=>(form.style.display='grid'),1000);
        //here we are making form display 'none' as we submit data and then to apply class hidden  we need 1s i.e1000 millisecond of transition and again making form to visible by putting its display value grid after 1 second bcz after 1 second form will replace by that list 
    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
    }

    _newWorkout(e) {

        const validInputs = (...inputs) =>
            inputs.every(inp => Number.isFinite(inp));
        //every here bcz if one result is false it will return false

        const allPositive = (...inputs) => inputs.every(inp => inp > 0);

        e.preventDefault();
        //1.Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;//string so we need to convert number
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;


        //4.if workout running ,create a running object
        if (type === 'running') {
            const cadence = +inputCadence.value;
            //2.check if data is valid
            if (
                // !Number.isFinite(distance) ||
                // !Number.isFinite(duration) ||
                // !Number.isFinite(cadence)
                //OR
                //3.if not will give popup msg
                !validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence)
            )
                return alert('Inputs have to be a positive number!')

            //running object
            // where to find coords,this.#mapEvent.latlng
            workout = new Running([lat, lng], distance, duration, cadence);

        }

        //5.if workout cycling ,create a cycling object
        if (type === 'cycling') {
            const elevationgain = +inputElevation.value;
            if (
                // !Number.isFinite(distance) ||
                // !Number.isFinite(duration) ||
                // !Number.isFinite(elevationgain)
                //OR
                !validInputs(distance, duration, elevationgain) ||
                !allPositive(distance, duration)
            )
                return alert('Inputs have to be a positive number!')
            workout = new Cycling([lat, lng], distance, duration, elevationgain);
        }

        //6. add new workout to array 
        this.#workouts.push(workout);
        console.log(workout);
        console.log(this.#workouts);

        //7.render the workout on map as marker
        this._renderWorkoutMarker(workout);


        //Display marker
        // const { lat, lng } = this.#mapEvent.latlng;

        //8.render workout on list 
        this._renderWorkout(workout);
        //9.clear input fields and hide  form--
        this._hideForm();
        //     //after sumiting /pressing enter input fields get clear 
        //     inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';

        //set local storage to all workouts
        this._setLocalStorage();
    }

    _renderWorkoutMarker(workout) {
        //Display marker
        // const { lat, lng } = this.#mapEvent.latlng;
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 300,
                minWidth: 30,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`,
            }))
            .setPopupContent(`${workout.type === 'running' ? "🏃" : "🚴🏼"} ${workout.description}`)
            .openPopup();
    }

    _renderWorkout(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id='${workout.id}'>
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === 'running' ? "🏃" : "🚴🏼"}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;

        if (workout.type === 'running')
            html += ` 
            <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${workout.pace.toFixed(1)}</span>
              <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
              <span class="workout__icon">🦶🏼</span>
              <span class="workout__value">${workout.cadence}</span>
              <span class="workout__unit">spm</span>
          </div>
        </li>`;


        if (workout.type === 'cycling')
            html += `
            <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${workout.speed.toFixed(1)}  </span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
              <span class="workout__icon">⛰</span>
              <span class="workout__value">${workout.elevationgain}</span>
              <span class="workout__unit">m</span>
          </div>
        </li>`;

        form.insertAdjacentHTML('afterend', html);


    }
    _moveToPopup(e){
        const workoutElement=e.target.closest('.workout');
        console.log(workoutElement);

        if(!workoutElement)return;
        
        const workout =this.#workouts.find(work=>work.id===workoutElement.dataset.id);
        console.log(workout);

        this.#map.setView(workout.coords,this.#mapZoomLevel,{
            animate:true,
            pan:{
                duration:1,
            }
        });
        // workout.click();

    }
    _setLocalStorage(){
      localStorage.setItem('workouts',JSON.stringify(this.#workouts)) ; 
      //we should not use localstorage for long data
    }
    _getLocalStorage(){
       const data=JSON.parse( localStorage.getItem('workouts'));
    //    console.log(data);

       if(!data)return;
       this.#workouts=data;

       this.#workouts.forEach(work=>{
        this._renderWorkout(work);
        
    });
    }
    //reset to remove workout items
    reset(){
        localStorage.removeItem('workouts');
        location.reload();
    }
};

const app = new App()//no arguments bcz it doesnot need and constructor doesnot have any parameters
// app._getPosition();//this method need to be called to get position




/////////////////////previous code////////////////////////////

// if (navigator.geolocation)
//     navigator.geolocation.getCurrentPosition(function (position) {
//         console.log(position);
//         const { latitude } = position.coords;//destructuring
//         const { longitude } = position.coords;
//         console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

//         const coords = [latitude, longitude];

//         //pasting code from leaflet library to get map
//         map = L.map('map').setView(coords, 13);//map object

//         L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',
//             {
//                 attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//             }).addTo(map);

//         //handling clicks on map
//         map.on('click', function (mapE) {
//             mapEvent = mapE;
//             form.classList.remove('hidden');
//             inputDistance.focus();




//             // console.log(mapEvent);
//             // const {lat,lng}= mapEvent.latlng;

//             // L.marker([lat,lng])
//             // .addTo(map)
//             // .bindPopup(L.popup({
//             //     maxWidth:300,
//             //     minWidth:30,
//             //     autoClose: false,
//             //     closeOnClick:false,
//             //     className:'running-popup',
//             // }))
//             // .setPopupContent('Workout')
//             // .openPopup();
//         });

//     },


//         function () {
//             alert('Unable to get your position ,Please turn on  your  location')
//         });


// form.addEventListener('submit', function (e) {
//     e.preventDefault();
//     //after sumiting /pressing enter input fields get clear
//     inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';

//     //Display marker
//     console.log(mapEvent);
//     const { lat, lng } = mapEvent.latlng;

//     L.marker([lat, lng])
//         .addTo(map)
//         .bindPopup(L.popup({
//             maxWidth: 300,
//             minWidth: 30,
//             autoClose: false,
//             closeOnClick: false,
//             className: 'running-popup',
//         }))
//         .setPopupContent('Workout')
//         .openPopup();
// });
// inputType.addEventListener('change', function () {
//     inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
//     inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
// });
        //displaying map using Leaflet javascript library
        // we can download the library or use the hoisted version by CDN         content Delivery Network
        // then add code into javaScript like above

        /////////////Display a map marker //////////////////////
        //wherever we click the marker move there using method similar to addEventlistner but which is avsilable on leaflet library ('on')and then inside that we apply l.marker to marker popup

        ///////////////Render form/////////////On clicking the map
        // whenever user click on map we have marker popup on map but now we want form to be open to be fill before marker popup and after that marker should popup with workout information
        // for that we need form and we remove its class hidden so it will be visible on every click before workout marker popup

        /////////////Refactoring for project //////////
        // we will create one app class where we we add all our code into different methods  like,_getPosition,_loadMap,_showForm,_toggleElevation field,_newWorkout

        ////////////Managing WorkOut data/////////////

        /////////rendering Workout/////////////////
        // showing workout on map with date
        /////////storing the data /////////
        // whenever the form is submitted it is stored on map as well as in list