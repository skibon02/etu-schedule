import { Schedule, DevSchedule } from "./Schedule";

export default function App() {
  const isDev = true;

  return (
    <>
    {isDev ? <DevSchedule /> : <Schedule />}
    </>
  )

}