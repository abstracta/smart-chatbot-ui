export function updateOrInsertItem<T>(array: T[] | undefined, newItem: T, comparator: (oldItem: T, newItem: T) => boolean, insertLast = true): T[] {
    if (!array || array.length == 0) return [newItem];
    else {
        let isItemPresent = false;
        const newArrayData = array.map((o) => {
            if (comparator(o, newItem)) {
                isItemPresent = true;
                return newItem;
            }
            return o;
        })
        if (!isItemPresent) insertLast ? newArrayData.push(newItem) : newArrayData.unshift(newItem);
        return newArrayData;
    }
}