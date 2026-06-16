const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'admin', 'pos', 'pos-client.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const searchPoint = '            mobileProvider: mixedBreakdown.mobileProvider,';
const restOfFileRegex = /  \}, \[cart, subtotal, discountAmount, taxAmount, grandTotal, change, clearCart, router, selectedDate\]\);/;

if (content.includes(searchPoint) && restOfFileRegex.test(content)) {
    // We split at searchPoint
    const parts = content.split(searchPoint);
    // Find the second part up to the end of the corrupted block
    const secondPart = parts[1].replace(restOfFileRegex, '');
    
    // We will rebuild it correctly
    const newContent = parts[0] + searchPoint + `
            mobileCashOutCharge: mixedBreakdown.mobileCashOutCharge,
            cardTrxId: mixedBreakdown.cardTrxId,
            cardLast4: mixedBreakdown.cardLast4,
          }),
        });

        setShowReceipt(true);
        clearCart();
        setIsProcessing(false);
        toast.success(\`Sale completed: \${result.orderNumber}\`);

        // Fetch stats in background so UI doesn't block for 2-3 seconds
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
    }
  }, [cart, subtotal, discountAmount, taxAmount, grandTotal, change, clearCart, router, selectedDate]);` + secondPart.substring(secondPart.indexOf('\n\n  const handleMixedPaymentConfirm') === -1 ? 0 : secondPart.indexOf('\n\n  const handleMixedPaymentConfirm'));

    // Wait, the second part might just be nothing. The match removes the corrupted `}, [...]`
    // Wait, replace just replaces the FIRST match of restOfFileRegex.
    
    const actualSecondPart = parts[1].replace(restOfFileRegex, `
            mobileCashOutCharge: mixedBreakdown.mobileCashOutCharge,
            cardTrxId: mixedBreakdown.cardTrxId,
            cardLast4: mixedBreakdown.cardLast4,
          }),
        });

        setShowReceipt(true);
        clearCart();
        setIsProcessing(false);
        toast.success(\`Sale completed: \${result.orderNumber}\`);

        // Fetch stats in background so UI doesn't block for 2-3 seconds
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
    }
  }, [cart, subtotal, discountAmount, taxAmount, grandTotal, change, clearCart, router, selectedDate]);`);

    fs.writeFileSync(filePath, parts[0] + searchPoint + actualSecondPart, 'utf8');
    console.log('Fixed pos-client.tsx');
} else {
    console.log('Search string not found!');
}
