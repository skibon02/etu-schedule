import { Schedule, DevSchedule } from "./Schedule";

export default function App() {
  const isDev = false;

  return (
    <>
    {isDev ? <DevSchedule /> : <Schedule />}
    </>
  )

}