import { redirect } from "next/navigation"

/** /mi-cuenta/cursos → el inicio del alumno ya lista sus cursos. */
export default function Cursos() {
  redirect("/mi-cuenta#mis-cursos")
}
