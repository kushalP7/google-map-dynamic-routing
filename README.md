# google-map-dynamic-routing

`google-map-dynamic-routing` is a TypeScript-based service that simplifies the routing and transportation logistics for students and drivers using Google Maps. It dynamically generates routes based on student locations and vehicle capacity, ensuring the most efficient route assignments for drivers.

## Installation

This is a [Angular](https://angular.dev/) module available through the
[npm registry](https://www.npmjs.com/).

Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```console
$ npm install google-map-dynamic-routing
```

## Features

  * Initialize and display Google Maps with school and student locations.
  * Automatically generate and display optimal routes for multiple drivers.
  * Efficiently handle vehicle capacity and distribute students based on proximity.
  * Supports real-time route updates with color-coded routes for each driver.
  * Calculate and log the total distance and duration for each driver’s route.

## Docs & Community
  * [GitHub Organization](https://github.com/kushalP7/google-map-dynamic-routing.git) for Official Middleware & Modules

## Quick Start

To integrate the google-map-dynamic-routing into your Angular application, follow the steps below.

1. Install the Package
First, install the package from npm:

```console
$ npm install google-map-dynamic-routing
```

2. Import and Initialize in Angular Component
In your Angular component, import the GoogleMapDynamicRouting and use it to set up the map and routing logic.
  
```ts
import { AfterViewInit, Component } from '@angular/core';
import { Assistant, Driver, GoogleMapDynamicRouting, School, Student } from 'google-map-dynamic-routing';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-test1',
  templateUrl: './test1.component.html',
  styleUrls: ['./test1.component.scss']
})
export class Test1Component implements AfterViewInit {
  gservice = new GoogleMapDynamicRouting();
  drivers: Driver[] = [];
  assistants: Assistant[] = [];
  schoolId = 2;
  vehicleCapacity = 5;
  mapZoom = 11;

  constructor() { }

  ngAfterViewInit() {
    const mapElement = document.getElementById("map") as HTMLElement;

    // Find school data from environment or use default
    const schoolData = environment.students.find((student) => student.SchoolID === this.schoolId);
    const schoolLocation:School = schoolData ? 
      { location: { lat: schoolData.SchoolLatitude, lng: schoolData.SchoolLongitude }, id: schoolData.SchoolID, name: schoolData.SchoolName } :
      { location: { lat: 51.24435222090445, lng: -0.19657615577176069 }, id: this.schoolId, name: "KP's School" };

    // Filter and map student data
    const students:Student[] = environment.students
      .filter(s => s.SchoolID === this.schoolId)
      .map((s, index) => ({ location: { lat: s.Latitude, lng: s.Longitude }, name: s.FirstName, id: index + 1 }));

    // add the assistant data here(You can make a api call or pass static data)
    const requiredDrivers = Math.ceil(students.length / this.vehicleCapacity);
    for (let i = 1; i <= requiredDrivers; i++) {
      const assistant: Assistant = {
        id: i,
        name: `Assistant-${i}`,
        location: {
          lat: schoolLocation.location.lat + (Math.random() * 0.02 - 0.01),
          lng: schoolLocation.location.lng + (Math.random() * 0.02 - 0.01)
        }
      };

      this.assistants.push(assistant);
    } 

    // Set values for the service
    this.gservice.setValues(schoolLocation, students, [], this.assistants, this.vehicleCapacity, this.mapZoom);

    // Initialize the map
    this.gservice.initMap(mapElement, schoolLocation.location);

    // Generate routes for the drivers
    this.gservice.createRoutesForDrivers();
    this.drivers = this.gservice.drivers;

  }

  getRouteForDriver(driverIndex: number) {
    this.gservice.getRouteForDriver(driverIndex);
  }
}

```
3. HTML Template
In your component's HTML, create a button for each driver that will show their route when clicked.

```html
<div>
  <button style="margin: 7px;" *ngFor="let driver of drivers; let i = index" (click)="getRouteForDriver(i)">
    Driver {{ i + 1 }}
  </button>
</div>

<!-- Map display -->
<div id="map" style="height: 1000px; width: 100%;"></div>
```

4. Fetching School and Student Data via API
Instead of storing school and student data in the environment.ts file, you can call an API to retrieve this information dynamically.

5. Google Maps API
Make sure you have set up the Google Maps API correctly in your index.html or in the environment configuration (like an API key) to ensure that the map functions as expected.
Example for index.html:
```html
 <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places"></script>
```

6. Run Your Application
Finally, run your Angular app using:

```ts
$ ng serve
```

Visit http://localhost:4200 to see the map with the routes generated for your drivers.

