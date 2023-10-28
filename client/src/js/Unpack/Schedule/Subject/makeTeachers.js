export function makeTeachers(teachers) {
  let teachersArr = []
  for (let i = 0; i < teachers.length; i++) {
    let teacher = teachers[i];
    teachersArr.push(
      <div key={teacher.id} className="lesson__teacher">
        {teacher.surname} {teacher.name} {teacher.midname}
      </div>
    );
  }
  return teachersArr;
}