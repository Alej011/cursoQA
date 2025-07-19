function saludar (nombre: string): string {
    return `Hola, ${nombre}!`;  
}

function sumar(a: number, b: number): number{
    return a + b;
}

const lenguaje: string = 'TypeScript';

let array: number[] = [1, 2, 3, 4, 5];
console.log(saludar(`Bienvenidos al curso de ${lenguaje}`));
console.log(sumar(10, 3));

array.forEach(element => {
   array.push(element + 1); 
});

console.log(array);
console.log(`El array tiene ${array.length} elementos.`);
