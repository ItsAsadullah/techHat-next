const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'admin', 'pos', 'pos-client.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Unblock UI
const searchBlocking = `        setShowReceipt(true);

        const [summary, dates] = await Promise.all([
          getDailySalesSummary(selectedDate),
          getPOSSalesDates(),
        ]);
        setDailySummary(summary);
        setSalesDates(dates);

        clearCart();
        toast.success(\`Sale completed: \${result.orderNumber}\`);
        // Refresh server data to get updated stock
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to complete sale');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsProcessing(false);
    }`;

const replaceUnblocking = `        setShowReceipt(true);
        clearCart();
        setIsProcessing(false);
        toast.success(\`Sale completed: \${result.orderNumber}\`);

        // Fetch stats in background so UI doesn't block
        Promise.all([
          getDailySalesSummary(selectedDate),
          getPOSSalesDates(),
        ]).then(([summary, dates]) => {
          setDailySummary(summary);
          setSalesDates(dates);
          // Refresh server data to get updated stock
          router.refresh();
        }).catch(console.error);

      } else {
        toast.error(result.error || 'Failed to complete sale');
        setIsProcessing(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
      setIsProcessing(false);
    }`;

if (content.includes(searchBlocking)) {
    content = content.replace(searchBlocking, replaceUnblocking);
    console.log('Unblocking fix applied');
} else {
    console.log('Unblocking search string NOT found');
}

// Fix 2: Add cartItems prop
const searchProp = `          <POSProductGrid
            categories={categories}
            onProductSelect={handleProductSelect}
            searchInputRef={searchInputRef}
            initialProducts={initialProducts}
          />`;

const replaceProp = `          <POSProductGrid
            categories={categories}
            onProductSelect={handleProductSelect}
            searchInputRef={searchInputRef}
            initialProducts={initialProducts}
            cartItems={cart.items}
          />`;

if (content.includes(searchProp)) {
    content = content.replace(searchProp, replaceProp);
    console.log('cartItems prop added');
} else {
    console.log('Prop search string NOT found');
}

fs.writeFileSync(filePath, content, 'utf8');
